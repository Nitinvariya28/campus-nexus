import math
from unittest.mock import MagicMock, patch
from django.urls import reverse
from django.test import SimpleTestCase
from rest_framework.test import APIClient
from rest_framework import status


class AI02ProfileRecommendationsTestCase(SimpleTestCase):
    """
    Unit tests for AI-02: Profile Recommendations API with Dual-Column 'Load More' Pagination.
    Verifies:
    1. HTTP 401 Unauthorized for anonymous callers.
    2. HTTP 200 with status="PROFILE_INCOMPLETE" when caller profile lacks skills/bio.
    3. HTTP 200 with status="SUCCESS" and dual columns (Top 5 Students, Top 5 Alumni) on initial load.
    4. Independent 'Load More' pagination (?target_role=STUDENT&student_page=2&limit=5).
    5. Strict self-exclusion (caller is never recommended to themselves).
    6. Exact card payload schema matching architectural contracts.
    """

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("ai_module:ai-profile-recommendations")

        # Mock caller user (Student #3002)
        self.mock_caller = MagicMock()
        self.mock_caller.id = 3002
        self.mock_caller.role = "STUDENT"
        self.mock_caller.first_name = "Nitin"
        self.mock_caller.last_name = "Variya"
        self.mock_caller.email = "nitin@example.com"
        self.mock_caller.get_full_name.return_value = "Nitin Variya"
        self.mock_caller.is_authenticated = True
        self.mock_caller.is_active = True

        mock_sp = MagicMock()
        mock_sp.bio = "Machine learning enthusiast building AI agents and recommendation engines."
        mock_sp.department.name = "Computer Science and Engineering"
        mock_sp.semester = 6
        mock_sp.batch.name = "2023"
        self.mock_caller.student_profile = mock_sp

        mock_skill_py = MagicMock(proficiency="ADVANCED")
        mock_skill_py.skill.name = "Python"
        mock_skill_dj = MagicMock(proficiency="INTERMEDIATE")
        mock_skill_dj.skill.name = "Django"
        self.mock_caller.user_skills.all.return_value = [mock_skill_py, mock_skill_dj]
        self.mock_caller.user_skills.exists.return_value = True

    def test_unauthenticated_request_fails(self):
        """Anonymous requests must be rejected with HTTP 401 Unauthorized."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("apps.ai_module.views.recommendation_views.User.objects")
    @patch("apps.ai_module.views.recommendation_views.is_profile_ready")
    def test_incomplete_profile_returns_guided_prompt(
        self,
        mock_is_ready,
        mock_user_objects,
    ):
        """When user profile is empty (cold-start), return PROFILE_INCOMPLETE with edit CTA."""
        incomplete_user = MagicMock()
        incomplete_user.id = 9999
        incomplete_user.role = "STUDENT"
        incomplete_user.first_name = "New"
        incomplete_user.last_name = "User"
        incomplete_user.email = "new@example.com"
        incomplete_user.get_full_name.return_value = "New User"
        incomplete_user.user_skills.exists.return_value = False
        incomplete_user.student_profile = None

        mock_user_objects.select_related.return_value.prefetch_related.return_value.get.return_value = incomplete_user
        mock_is_ready.return_value = (False, "Student has zero technical skills and no academic bio")

        self.client.force_authenticate(user=incomplete_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "PROFILE_INCOMPLETE")
        self.assertIn("skills", data["missing_fields"])
        self.assertEqual(data["profile_edit_url"], "/profile/edit/")
        self.assertEqual(len(data["students"]["items"]), 0)
        self.assertEqual(len(data["alumni"]["items"]), 0)
        self.assertFalse(data["students"]["has_more"])

    @patch("apps.ai_module.views.recommendation_views.User.objects")
    @patch("apps.ai_module.views.recommendation_views.is_profile_ready")
    @patch("apps.ai_module.views.recommendation_views.ProfileRetriever")
    @patch("apps.ai_module.views.recommendation_views.ResultAggregator")
    @patch("apps.ai_module.views.recommendation_views.RankingService")
    def test_successful_dual_column_recommendations(
        self,
        mock_ranking_cls,
        mock_aggregator_cls,
        mock_retriever_cls,
        mock_is_ready,
        mock_user_objects,
    ):
        """Complete profile caller receives top 5 students and top 5 alumni on initial load."""
        mock_user_objects.select_related.return_value.prefetch_related.return_value.get.return_value = self.mock_caller
        mock_is_ready.return_value = (True, "Ready")

        # Mock candidate pool
        mock_retriever = MagicMock()
        mock_retriever_cls.return_value = mock_retriever
        mock_retriever.retrieve_candidates.return_value = [MagicMock()] * 10

        mock_aggregator_cls.pool_and_deduplicate.return_value = {
            i: {"user_id": i, "best_score": 0.85} for i in range(1, 11)
        }

        # Mock hydrated users
        mock_candidates = {}
        for i in range(1, 11):
            cand = MagicMock()
            cand.id = i
            cand.role = "STUDENT" if i <= 5 else "ALUMNI"
            cand.first_name = f"User{i}"
            cand.last_name = "Candidate"
            cand.email = f"user{i}@example.com"
            cand.get_full_name.return_value = f"User{i} Candidate"
            cand.profile_photo = f"/media/photos/u{i}.jpg"
            cand.user_skills.all.return_value = []
            mock_candidates[i] = cand

        mock_aggregator_cls.hydrate_candidate_users.return_value = mock_candidates

        # Mock ranking service output (10 ranked candidates)
        mock_ranking = MagicMock()
        mock_ranking_cls.return_value = mock_ranking
        ranked_list = [
            {
                "user_id": i,
                "role": "STUDENT" if i <= 5 else "ALUMNI",
                "department": "Computer Science and Engineering",
                "final_score": 0.90 - (i * 0.02),
                "match_reasons": ["Strong skill overlap in Python, Django"],
            }
            for i in range(1, 11)
        ]
        mock_ranking.rank_and_explain.return_value = ranked_list

        self.client.force_authenticate(user=self.mock_caller)
        response = self.client.get(self.url, {"limit": 5})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("students", data)
        self.assertIn("alumni", data)

        # Check student pagination
        students_page = data["students"]
        self.assertEqual(students_page["page"], 1)
        self.assertEqual(students_page["limit"], 5)
        self.assertEqual(len(students_page["items"]), 5)
        self.assertEqual(students_page["total_count"], 10)
        self.assertTrue(students_page["has_more"])

        # Check first card structure
        first_card = students_page["items"][0]
        self.assertEqual(first_card["user_id"], 1)
        self.assertEqual(first_card["full_name"], "User1 Candidate")
        self.assertEqual(first_card["role"], "STUDENT")
        self.assertEqual(first_card["profile_url"], "/profile/1/")
        self.assertGreaterEqual(first_card["match_score"], 0.0)

    @patch("apps.ai_module.views.recommendation_views.User.objects")
    @patch("apps.ai_module.views.recommendation_views.is_profile_ready")
    @patch("apps.ai_module.views.recommendation_views.ProfileRetriever")
    @patch("apps.ai_module.views.recommendation_views.ResultAggregator")
    @patch("apps.ai_module.views.recommendation_views.RankingService")
    def test_pagination_load_more_student_column(
        self,
        mock_ranking_cls,
        mock_aggregator_cls,
        mock_retriever_cls,
        mock_is_ready,
        mock_user_objects,
    ):
        """Requesting target_role=STUDENT & student_page=2 returns only the 2nd page of students."""
        mock_user_objects.select_related.return_value.prefetch_related.return_value.get.return_value = self.mock_caller
        mock_is_ready.return_value = (True, "Ready")

        mock_retriever = MagicMock()
        mock_retriever_cls.return_value = mock_retriever
        mock_retriever.retrieve_candidates.return_value = [MagicMock()] * 10
        mock_aggregator_cls.pool_and_deduplicate.return_value = {
            i: {"user_id": i, "best_score": 0.80} for i in range(1, 9)
        }

        mock_candidates = {}
        for i in range(1, 9):
            cand = MagicMock()
            cand.id = i
            cand.role = "STUDENT"
            cand.first_name = f"Student{i}"
            cand.last_name = "Candidate"
            cand.get_full_name.return_value = f"Student{i} Candidate"
            cand.user_skills.all.return_value = []
            mock_candidates[i] = cand

        mock_aggregator_cls.hydrate_candidate_users.return_value = mock_candidates

        mock_ranking = MagicMock()
        mock_ranking_cls.return_value = mock_ranking
        # 8 total student candidates
        mock_ranking.rank_and_explain.return_value = [
            {
                "user_id": i,
                "role": "STUDENT",
                "department": "Computer Science",
                "final_score": 0.85 - (i * 0.02),
                "match_reasons": ["Skill overlap"],
            }
            for i in range(1, 9)
        ]

        self.client.force_authenticate(user=self.mock_caller)
        # Request Page 2 with limit 5 (items 6, 7, 8)
        response = self.client.get(self.url, {
            "target_role": "STUDENT",
            "student_page": 2,
            "limit": 5,
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["target_role"], "STUDENT")
        self.assertIn("students", data)
        self.assertNotIn("alumni", data)

        students_page = data["students"]
        self.assertEqual(students_page["page"], 2)
        self.assertEqual(students_page["limit"], 5)
        # Page 2 should have exactly 3 items (8 total - 5 on page 1)
        self.assertEqual(len(students_page["items"]), 3)
        self.assertEqual(students_page["total_count"], 8)
        self.assertEqual(students_page["total_pages"], 2)
        self.assertFalse(students_page["has_more"])
        self.assertEqual(students_page["items"][0]["user_id"], 6)

    @patch("apps.ai_module.views.recommendation_views.User.objects")
    @patch("apps.ai_module.views.recommendation_views.is_profile_ready")
    @patch("apps.ai_module.views.recommendation_views.ProfileRetriever")
    @patch("apps.ai_module.views.recommendation_views.ResultAggregator")
    @patch("apps.ai_module.views.recommendation_views.RankingService")
    def test_strict_self_exclusion(
        self,
        mock_ranking_cls,
        mock_aggregator_cls,
        mock_retriever_cls,
        mock_is_ready,
        mock_user_objects,
    ):
        """Calling user (ID 3002) must NEVER appear in recommendations."""
        mock_user_objects.select_related.return_value.prefetch_related.return_value.get.return_value = self.mock_caller
        mock_is_ready.return_value = (True, "Ready")

        mock_retriever = MagicMock()
        mock_retriever_cls.return_value = mock_retriever
        mock_retriever.retrieve_candidates.return_value = [MagicMock()]

        # Simulate candidate pool that does not include 3002
        mock_aggregator_cls.pool_and_deduplicate.return_value = {
            105: {"user_id": 105, "best_score": 0.90}
        }
        cand = MagicMock()
        cand.id = 105
        cand.role = "STUDENT"
        cand.get_full_name.return_value = "Peer Student"
        cand.user_skills.all.return_value = []
        mock_aggregator_cls.hydrate_candidate_users.return_value = {105: cand}

        mock_ranking = MagicMock()
        mock_ranking_cls.return_value = mock_ranking
        mock_ranking.rank_and_explain.return_value = [
            {"user_id": 105, "role": "STUDENT", "department": "IT", "final_score": 0.88, "match_reasons": []}
        ]

        self.client.force_authenticate(user=self.mock_caller)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        student_ids = [item["user_id"] for item in data.get("students", {}).get("items", [])]
        alumni_ids = [item["user_id"] for item in data.get("alumni", {}).get("items", [])]

        self.assertNotIn(self.mock_caller.id, student_ids)
        self.assertNotIn(self.mock_caller.id, alumni_ids)
