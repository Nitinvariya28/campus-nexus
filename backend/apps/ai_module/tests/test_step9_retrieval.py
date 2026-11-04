from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase

from apps.ai_module.retrieval.profile_retriever import ProfileRetriever
from apps.ai_module.retrieval.result_aggregator import ResultAggregator
from apps.ai_module.retrieval.ranking_service import RankingService, get_profile_recommendations
from apps.ai_module.vector_store.collection_manager import (
    COLLECTION_STUDENT_VECTORS,
    COLLECTION_ALUMNI_VECTORS,
)


class Step9RetrievalAndRankingTestCase(SimpleTestCase):
    """
    Unit tests for Step 9: Candidate Retrieval & Multi-Signal Ranking Engine.
    Verifies:
    1. ProfileRetriever filter construction and self-exclusion
    2. ResultAggregator max-similarity pooling and deduplication
    3. RankingService 50/30/10/10 hybrid scoring
    4. Skill overlap calculation with proficiency bonus
    5. Academic and career compatibility evaluation
    6. Grounded, explainable match reason synthesis
    """

    def setUp(self):
        self.mock_client = MagicMock()
        self.mock_embedding_service = MagicMock()
        self.mock_embedding_service.embed_query.return_value = [0.1] * 384
        self.retriever = ProfileRetriever(
            client=self.mock_client,
            embedding_service=self.mock_embedding_service,
        )
        self.ranking_service = RankingService()

    # ----------------- ProfileRetriever Tests -----------------

    def test_build_caller_query_text(self):
        """build_caller_query_text synthesizes skills and academic details."""
        caller = MagicMock(id=10, role="STUDENT")
        s1 = MagicMock(proficiency="ADVANCED")
        s1.skill.name = "Python"
        s2 = MagicMock(proficiency="INTERMEDIATE")
        s2.skill.name = "Docker"
        caller.user_skills.all.return_value = [s1, s2]
        caller.student_profile.department.name = "CSE"
        caller.student_profile.batch.name = "Batch 2024"
        caller.student_profile.bio = "Passionate engineer"

        query_text = self.retriever.build_caller_query_text(caller)

        self.assertIn("Python (ADVANCED)", query_text)
        self.assertIn("Docker (INTERMEDIATE)", query_text)
        self.assertIn("CSE", query_text)
        self.assertIn("Passionate engineer", query_text)

    def test_retriever_enforces_self_exclusion_in_filter(self):
        """Qdrant query must include must_not condition for mysql_user_id == caller_user_id."""
        self.mock_client.query_points.return_value = MagicMock(points=[])

        self.retriever.retrieve_candidates(
            caller_user_id=42,
            target_role="STUDENT",
            query_text="Machine Learning",
            top_k=20,
        )

        self.mock_client.query_points.assert_called_once()
        call_kwargs = self.mock_client.query_points.call_args[1]
        self.assertEqual(call_kwargs["collection_name"], COLLECTION_STUDENT_VECTORS)

        qfilter = call_kwargs["query_filter"]
        # Assert self-exclusion in must_not
        self.assertEqual(len(qfilter.must_not), 1)
        self.assertEqual(qfilter.must_not[0].key, "mysql_user_id")
        self.assertEqual(qfilter.must_not[0].match.value, 42)

        # Assert is_active in must
        self.assertEqual(len(qfilter.must), 1)
        self.assertEqual(qfilter.must[0].key, "is_active")
        self.assertEqual(qfilter.must[0].match.value, True)

    def test_retriever_targets_both_collections_when_role_all(self):
        """target_role='ALL' queries both student_vectors and alumni_vectors."""
        self.mock_client.query_points.return_value = MagicMock(points=[])

        self.retriever.retrieve_candidates(
            caller_user_id=100,
            target_role="ALL",
            query_text="Data Science",
        )

        self.assertEqual(self.mock_client.query_points.call_count, 2)
        called_collections = [
            call[1]["collection_name"] for call in self.mock_client.query_points.call_args_list
        ]
        self.assertIn(COLLECTION_STUDENT_VECTORS, called_collections)
        self.assertIn(COLLECTION_ALUMNI_VECTORS, called_collections)

    # ----------------- ResultAggregator Tests -----------------

    def test_pool_and_deduplicate_max_pooling(self):
        """Multi-chunk hits for the same user are pooled using the maximum similarity score."""
        hit1 = MagicMock(score=0.72, payload={"mysql_user_id": 200, "chunk_type": "STUDENT_SKILLS", "role": "STUDENT"})
        hit2 = MagicMock(score=0.88, payload={"mysql_user_id": 200, "chunk_type": "STUDENT_ACADEMIC", "role": "STUDENT"})
        hit3 = MagicMock(score=0.65, payload={"mysql_user_id": 300, "chunk_type": "ALUMNI_CAREER", "role": "ALUMNI"})
        hit_caller = MagicMock(score=0.99, payload={"mysql_user_id": 999, "chunk_type": "STUDENT_SKILLS", "role": "STUDENT"})

        raw_hits = [hit1, hit2, hit3, hit_caller]
        pool = ResultAggregator.pool_and_deduplicate(raw_hits, caller_user_id=999)

        # Assert caller excluded
        self.assertNotIn(999, pool)
        # Assert user 200 has max score 0.88
        self.assertIn(200, pool)
        self.assertEqual(pool[200]["best_score"], 0.88)
        self.assertIn("STUDENT_SKILLS", pool[200]["chunk_types"])
        self.assertIn("STUDENT_ACADEMIC", pool[200]["chunk_types"])
        # Assert user 300
        self.assertEqual(pool[300]["best_score"], 0.65)

    # ----------------- RankingService Tests -----------------

    def test_compute_skill_overlap(self):
        """compute_skill_overlap computes Jaccard and adds proficiency bonus."""
        caller = MagicMock()
        cand = MagicMock()

        # Caller: Python (ADVANCED), Django (INTERMEDIATE)
        s1 = MagicMock(proficiency="ADVANCED")
        s1.skill.name = "Python"
        s2 = MagicMock(proficiency="INTERMEDIATE")
        s2.skill.name = "Django"
        caller.user_skills.all.return_value = [s1, s2]

        # Cand: Python (ADVANCED), Docker (BEGINNER)
        c1 = MagicMock(proficiency="ADVANCED")
        c1.skill.name = "Python"
        c2 = MagicMock(proficiency="BEGINNER")
        c2.skill.name = "Docker"
        cand.user_skills.all.return_value = [c1, c2]

        # Intersection: 1 (Python), Union: 3 (Python, Django, Docker) -> Jaccard = 1/3 = 0.3333
        # Both have ADVANCED on Python -> Bonus = +0.05 -> Score = 0.3833
        score, shared = self.ranking_service.compute_skill_overlap(caller, cand)

        self.assertAlmostEqual(score, 0.3833, places=3)
        self.assertEqual(shared, ["Python"])

    def test_compute_composite_score(self):
        """compute_composite_score strictly evaluates 50/30/10/10 weights."""
        score = self.ranking_service.compute_composite_score(
            semantic_score=0.80,
            skill_score=0.60,
            academic_score=1.00,
            career_score=0.50,
        )
        # 0.50*0.80 + 0.30*0.60 + 0.10*1.00 + 0.10*0.50 = 0.40 + 0.18 + 0.10 + 0.05 = 0.73
        self.assertEqual(score, 0.73)

    def test_rank_and_explain_orders_by_final_score(self):
        """rank_and_explain sorts candidates descending and formats explainable reasons."""
        caller = MagicMock(id=1, role="STUDENT")
        caller.user_skills.all.return_value = []
        caller.student_profile.department_id = 1
        caller.student_profile.department.name = "Computer Engineering"
        caller.student_profile.batch_id = 5

        # Candidate A: high semantic
        cand_a = MagicMock(id=10, role="STUDENT", is_active=True)
        cand_a.user_skills.all.return_value = []
        cand_a.student_profile.department_id = 1
        cand_a.student_profile.department.name = "Computer Engineering"
        cand_a.student_profile.batch_id = 5

        # Candidate B: low semantic
        cand_b = MagicMock(id=20, role="STUDENT", is_active=True)
        cand_b.user_skills.all.return_value = []
        cand_b.student_profile.department_id = 2
        cand_b.student_profile.department.name = "Mechanical"
        cand_b.student_profile.batch_id = 9

        pool = {
            10: {"best_score": 0.85, "chunk_types": ["STUDENT_SKILLS"]},
            20: {"best_score": 0.40, "chunk_types": ["STUDENT_OVERVIEW"]},
        }
        hydrated = {10: cand_a, 20: cand_b}

        results = self.ranking_service.rank_and_explain(
            caller=caller,
            candidate_pool=pool,
            hydrated_users=hydrated,
            limit=5,
        )

        self.assertEqual(len(results), 2)
        # Candidate A must be ranked #1
        self.assertEqual(results[0]["user_id"], 10)
        self.assertGreater(results[0]["final_score"], results[1]["final_score"])
        # Match reasons must include department and semantic affinity
        self.assertTrue(any("Computer Engineering" in r for r in results[0]["match_reasons"]))
        self.assertTrue(any("semantic profile affinity" in r for r in results[0]["match_reasons"]))
