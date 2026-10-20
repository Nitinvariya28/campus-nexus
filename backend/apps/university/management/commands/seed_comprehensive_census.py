import random
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.accounts.models import User
from apps.university.models import Department, Batch, UniversityIdentity
from apps.profiles.models import StudentProfile, AlumniProfile, StudentPlacementRecord
from apps.skills.models import SkillCategory, Skill, UserSkill, MasterLearningPlatform, UserLearningResource, UserAIUsage, SocialLink
from apps.resumes.models import Resume, ResumeAnalysis
from apps.companies.models import Company, CompanyRole
from apps.community.models import Post, Comment, Tag, PostTag, PostLike
from apps.interviews.models import InterviewExperience, InterviewRound

# --- Realistic Indian Names Pool ---
FIRST_NAMES_MALE = [
    "Aarav", "Aditya", "Advait", "Akash", "Aniket", "Arjun", "Atharva", "Ayush",
    "Chirag", "Darsh", "Dev", "Dhruv", "Harsh", "Ishaan", "Jay", "Kabir", "Karan",
    "Kunal", "Manan", "Mayank", "Meet", "Nikhil", "Nirav", "Parth", "Pranav",
    "Pranay", "Rahul", "Rishi", "Rohan", "Sahil", "Samarth", "Sanket", "Shaurya",
    "Shivam", "Siddharth", "Tanmay", "Utkarsh", "Varun", "Vedant", "Vihaan", "Yash"
]

FIRST_NAMES_FEMALE = [
    "Aadhya", "Aarohi", "Aditi", "Ananya", "Anushka", "Avani", "Bhavya", "Charvi",
    "Disha", "Diya", "Drasti", "Isha", "Ishita", "Janvi", "Khushi", "Kavya",
    "Khushbu", "Krisha", "Mansi", "Meera", "Mugdha", "Navya", "Neha", "Nidhi",
    "Pooja", "Prisha", "Priya", "Rashi", "Rhea", "Riya", "Saanvi", "Saloni",
    "Shivani", "Shreya", "Simran", "Sneha", "Tanvi", "Urvi", "Vanshika", "Vidhi"
]

LAST_NAMES = [
    "Patel", "Shah", "Sharma", "Verma", "Mehta", "Joshi", "Trivedi", "Desai",
    "Pandey", "Iyer", "Rao", "Kulkarni", "Singh", "Gupta", "Mishra", "Chauhan",
    "Deshmukh", "Prajapati", "Bhatt", "Vora", "Gajjar", "Soni", "Pandya", "Dave",
    "Panchal", "Modi", "Thakur", "Rathod", "Makwana", "Doshi", "Zaveri", "Chokshi"
]

CITIES = [
    "Ahmedabad", "Gandhinagar", "Vadodara", "Surat", "Rajkot", "Mumbai", "Pune",
    "Bengaluru", "Hyderabad", "Noida", "Gurugram", "Delhi", "Chennai"
]

# --- Department-specific Bios and Skill Keywords ---
DEPT_CONFIG = {
    'CSE': {
        'roll_prefix': 'bce',
        'bios': [
            "Computer Science undergrad passionate about distributed systems, cloud computing, and high-performance algorithms.",
            "Full-stack software developer exploring scalable microservices, backend architecture, and open-source contributions.",
            "Aspiring software development engineer with hands-on experience in modern web frameworks and competitive programming.",
            "Passionate about system architecture, concurrency, and building fault-tolerant backend services in Go and Java."
        ],
        'skill_names': ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Django', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Data Structures & Algorithms', 'System Design', 'Git'],
        'job_category': 'SOFTWARE'
    },
    'BCE': {
        'roll_prefix': 'bce',
        'bios': [
            "Computer Engineering student focusing on software-hardware co-design, OS kernels, and algorithmic optimization.",
            "Passionate software engineering enthusiast with strong foundation in core computer science, databases, and networks."
        ],
        'skill_names': ['C++', 'Python', 'Java', 'Linux', 'Data Structures & Algorithms', 'PostgreSQL', 'React', 'Docker', 'Git'],
        'job_category': 'SOFTWARE'
    },
    'IT': {
        'roll_prefix': 'bce',
        'bios': [
            "Information Technology student specializing in enterprise web architecture, cloud deployment, and cybersecurity.",
            "Full-stack developer building robust cloud-native applications with modern CI/CD pipelines and microservices."
        ],
        'skill_names': ['Python', 'Java', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Docker', 'AWS', 'Linux', 'SQL', 'Git'],
        'job_category': 'SOFTWARE'
    },
    'AIDS': {
        'roll_prefix': 'bam',
        'bios': [
            "Artificial Intelligence & Data Science enthusiast passionate about machine learning, deep learning, and computer vision.",
            "Data scientist focused on predictive modeling, large language models, and scalable data processing pipelines.",
            "Exploring neural networks, NLP, and MLOps to deploy production-grade intelligent systems."
        ],
        'skill_names': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Pandas', 'NumPy', 'Data Analysis', 'Docker', 'Git'],
        'job_category': 'DATA_SCIENCE'
    },
    'ECE': {
        'roll_prefix': 'bec',
        'bios': [
            "Electronics & Communication undergrad exploring embedded systems, IoT architectures, and VLSI circuit design.",
            "Hardware-software engineer with practical experience in FPGA prototyping, microcontroller firmware, and wireless protocols."
        ],
        'skill_names': ['C', 'C++', 'Linux', 'Python', 'MATLAB', 'Git', 'Data Structures & Algorithms'],
        'job_category': 'SOFTWARE'
    },
    'BEC': {
        'roll_prefix': 'bec',
        'bios': [
            "Electronics & Communication student with strong interest in digital electronics, firmware development, and signal processing."
        ],
        'skill_names': ['C', 'C++', 'Linux', 'Python', 'MATLAB', 'Git'],
        'job_category': 'SOFTWARE'
    },
    'EE': {
        'roll_prefix': 'bee',
        'bios': [
            "Electrical Engineering student passionate about power electronics, electric drives, and smart grid systems.",
            "Exploring renewable energy integration, battery management systems, and industrial automation."
        ],
        'skill_names': ['MATLAB', 'Python', 'C', 'Linux', 'Git'],
        'job_category': 'CORE'
    },
    'BEE': {
        'roll_prefix': 'bee',
        'bios': [
            "Electrical Engineering undergraduate interested in control systems, power systems, and energy storage technology."
        ],
        'skill_names': ['MATLAB', 'Python', 'C', 'Git'],
        'job_category': 'CORE'
    },
    'ME': {
        'roll_prefix': 'bme',
        'bios': [
            "Mechanical Engineering student passionate about CAD/CAM design, finite element analysis, and computational fluid dynamics.",
            "Robotics and automation enthusiast exploring structural mechanics, thermal systems, and rapid prototyping."
        ],
        'skill_names': ['Python', 'MATLAB', 'C++', 'Linux', 'Git'],
        'job_category': 'CORE'
    },
    'BME': {
        'roll_prefix': 'bme',
        'bios': [
            "Mechanical Engineering undergrad focusing on manufacturing optimization, mechatronics, and solid mechanics simulation."
        ],
        'skill_names': ['Python', 'MATLAB', 'Git'],
        'job_category': 'CORE'
    },
    'CE': {
        'roll_prefix': 'bcv',
        'bios': [
            "Civil Engineering student specializing in structural analysis, earthquake engineering, and sustainable construction materials.",
            "Passionate about smart city infrastructure, geotechnical modeling, and project planning methodologies."
        ],
        'skill_names': ['Python', 'MATLAB', 'SQL', 'Git'],
        'job_category': 'CORE'
    },
    'BCV': {
        'roll_prefix': 'bcv',
        'bios': [
            "Civil Engineering student focusing on modern construction management, structural design, and GIS spatial modeling."
        ],
        'skill_names': ['Python', 'MATLAB', 'SQL', 'Git'],
        'job_category': 'CORE'
    },
    'BCH': {
        'roll_prefix': 'bch',
        'bios': [
            "Chemical Engineering student passionate about process design, reaction kinetics, and computational chemical engineering.",
            "Exploring industrial plant simulation, thermodynamics, polymer engineering, and sustainable green chemistry."
        ],
        'skill_names': ['Python', 'MATLAB', 'SQL', 'Git'],
        'job_category': 'CORE'
    },
    'BAM': {
        'roll_prefix': 'bam',
        'bios': [
            "Automobile Engineering undergrad dedicated to electric vehicle (EV) powertrain optimization and autonomous driving tech.",
            "Vehicle dynamics and automotive design enthusiast with hands-on projects in telemetry and battery management."
        ],
        'skill_names': ['Python', 'MATLAB', 'C++', 'Linux', 'Git'],
        'job_category': 'CORE'
    }
}

ALUMNI_JOB_TITLES = [
    ("Senior Software Engineer", "SOFTWARE"),
    ("Staff Software Engineer", "SOFTWARE"),
    ("Tech Lead", "SOFTWARE"),
    ("Backend Engineer", "SOFTWARE"),
    ("Frontend Architect", "SOFTWARE"),
    ("Senior Data Scientist", "DATA_SCIENCE"),
    ("Machine Learning Engineer", "DATA_SCIENCE"),
    ("Lead AI Researcher", "DATA_SCIENCE"),
    ("DevOps & Cloud Architect", "DEVOPS_CLOUD"),
    ("Site Reliability Engineer", "DEVOPS_CLOUD"),
    ("Product Manager", "PRODUCT_MANAGEMENT"),
    ("Senior Product Manager", "PRODUCT_MANAGEMENT"),
    ("Design & UI/UX Specialist", "DESIGN"),
    ("Cyber Security Engineer", "SECURITY"),
    ("Senior Structural Engineer", "CORE"),
    ("Project Lead", "CORE"),
    ("Process Automation Engineer", "CORE"),
    ("EV Powertrain Engineer", "CORE")
]

class Command(BaseCommand):
    help = "Institution-wide realistic census seeding and profile enrichment across all departments, batches, and semesters."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("=== Commencing AlumiBridge Institutional Census Seeding & Normalization ==="))
        
        # 1. Cache Existing Data
        existing_emails = set(User.objects.values_list('email', flat=True))
        existing_identities = set(UniversityIdentity.objects.values_list('university_email', flat=True))
        all_companies = list(Company.objects.all())
        all_platforms = list(MasterLearningPlatform.objects.all())
        all_skills = list(Skill.objects.all())
        skill_map = {s.name.lower(): s for s in all_skills}
        
        batches = {b.start_year: b for b in Batch.objects.all()}
        departments = {d.code.upper(): d for d in Department.objects.all()}
        
        self.stdout.write(f"Loaded {len(all_companies)} companies, {len(all_platforms)} learning platforms, {len(all_skills)} skills.")

        # --- Helper: Generate Unique Student Email ---
        roll_counters = {}
        def generate_student_email(admission_year, branch_code):
            prefix = f"{admission_year % 100:02d}{branch_code.lower()}"
            if prefix not in roll_counters:
                roll_counters[prefix] = 1
            while True:
                roll = roll_counters[prefix]
                roll_counters[prefix] += 1
                email = f"{prefix}{roll:03d}@nirmauni.ac.in"
                if email not in existing_emails:
                    existing_emails.add(email)
                    return email

        # --- Helper: Generate Unique Alumni University Email ---
        alumni_uni_counters = {}
        def generate_alumni_uni_email(grad_year, branch_code):
            adm_year = grad_year - 4
            prefix = f"{adm_year % 100:02d}{branch_code.lower()}"
            if prefix not in alumni_uni_counters:
                alumni_uni_counters[prefix] = 1
            while True:
                roll = alumni_uni_counters[prefix]
                alumni_uni_counters[prefix] += 1
                email = f"{prefix}{roll:03d}@nirmauni.ac.in"
                if email not in existing_identities:
                    existing_identities.add(email)
                    return email

        # --- Helper: Generate Realistic Name ---
        def generate_name():
            if random.random() < 0.5:
                first = random.choice(FIRST_NAMES_MALE)
            else:
                first = random.choice(FIRST_NAMES_FEMALE)
            last = random.choice(LAST_NAMES)
            return first, last

        # --- Helper: Seed Profile Extensions (Skills, Socials, AI, Resources) ---
        def enrich_user_extensions(user, dept_code, is_alumni=False, sem=1):
            cfg = DEPT_CONFIG.get(dept_code, DEPT_CONFIG['CSE'])
            
            # 1. User Skills
            user_skill_names = cfg['skill_names']
            num_skills = random.randint(6, 10) if is_alumni else random.randint(4, 7)
            chosen_names = random.sample(user_skill_names, min(num_skills, len(user_skill_names)))
            for sname in chosen_names:
                skill_obj = skill_map.get(sname.lower())
                if skill_obj:
                    if is_alumni or sem >= 7:
                        prof = random.choice(['INTERMEDIATE', 'ADVANCED'])
                    elif sem >= 4:
                        prof = random.choice(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
                    else:
                        prof = random.choice(['BEGINNER', 'INTERMEDIATE'])
                    UserSkill.objects.update_or_create(
                        user=user, skill=skill_obj,
                        defaults={'proficiency': prof}
                    )
            
            # 2. Social Links
            username_slug = f"{user.first_name.lower()}.{user.last_name.lower()}.{user.id}"
            SocialLink.objects.update_or_create(
                user=user, platform='LINKEDIN',
                defaults={'url': f"https://www.linkedin.com/in/{username_slug}"}
            )
            SocialLink.objects.update_or_create(
                user=user, platform='GITHUB',
                defaults={'url': f"https://github.com/{username_slug.replace('.', '')}"}
            )
            if not is_alumni and sem >= 3:
                SocialLink.objects.update_or_create(
                    user=user, platform='LEETCODE',
                    defaults={'url': f"https://leetcode.com/u/{username_slug.replace('.', '_')}"}
                )

            # 3. Learning Resources
            if all_platforms:
                sample_platforms = random.sample(all_platforms, min(3, len(all_platforms)))
                for plat in sample_platforms:
                    UserLearningResource.objects.update_or_create(
                        user=user, platform=plat,
                        defaults={'url': f"https://{plat.name.lower().replace(' ', '')}.com/explore"}
                    )

            # 4. AI Usage
            tools = random.sample(['CHATGPT', 'GEMINI', 'CLAUDE', 'GITHUB_COPILOT', 'CURSOR'], 2)
            for tool in tools:
                UserAIUsage.objects.update_or_create(
                    user=user, ai_tool=tool,
                    defaults={
                        'usage_frequency': random.choice(['OCCASIONALLY', 'REGULARLY', 'HEAVILY']),
                        'daily_time_range': random.choice(['30_TO_60_MIN', '1_TO_2_HOURS', '2_TO_4_HOURS']),
                        'usage_purpose': random.choice(['CODING', 'DEBUGGING', 'LEARNING', 'INTERVIEW_PREPARATION'])
                    }
                )

        # =========================================================================
        # PHASE 1: NORMALIZE EXISTING STUDENTS (Fix Emails, Enrich Empty Profiles)
        # =========================================================================
        self.stdout.write("--- Phase 1: Normalizing & Enriching Existing Students ---")
        existing_students = StudentProfile.objects.select_related('user', 'department', 'batch').filter(user__role='STUDENT')
        
        import re
        strict_regex = re.compile(r'^\d{2}(bce|bec|bme|bam|bch|bee|bcv)\d{3}@nirmauni\.ac\.in$', re.I)
        
        for sp in existing_students:
            u = sp.user
            email_changed = False
            if not strict_regex.match(u.email):
                # Clean up email
                clean_email = re.sub(r'_\d+', '', u.email)
                if not strict_regex.match(clean_email):
                    # Generate fresh valid email based on batch start_year
                    dept_c = sp.department.code.upper() if sp.department else 'CSE'
                    roll_pfx = DEPT_CONFIG.get(dept_c, {}).get('roll_prefix', 'bce')
                    year = sp.batch.start_year if sp.batch else 2024
                    clean_email = generate_student_email(year, roll_pfx)
                if clean_email != u.email and clean_email not in existing_emails:
                    existing_emails.add(clean_email)
                    u.email = clean_email
                    email_changed = True
            
            # Enrich user attributes if needed
            if not u.first_name:
                u.first_name, u.last_name = generate_name()
                email_changed = True
            if not u.is_verified:
                u.is_verified = True
                email_changed = True
            if email_changed:
                u.save()

            # Enrich Student Profile fields
            dept_c = sp.department.code.upper() if sp.department else 'CSE'
            cfg = DEPT_CONFIG.get(dept_c, DEPT_CONFIG['CSE'])
            
            sp_updated = False
            if not sp.bio:
                sp.bio = random.choice(cfg['bios'])
                sp_updated = True
            if not sp.phone:
                sp.phone = f"+91 {random.randint(7000000000, 9999999999)}"
                sp_updated = True
            if not sp.address:
                sp.address = f"{random.choice(CITIES)}, Gujarat, India"
                sp_updated = True
            if sp_updated:
                sp.save()

            enrich_user_extensions(u, dept_c, is_alumni=False, sem=sp.semester or 1)

            # Resume & ATS Analysis for students in sem 3-8
            if (sp.semester or 1) >= 3 and not Resume.objects.filter(user=u).exists():
                res = Resume.objects.create(
                    user=u,
                    title=f"{u.first_name}_{u.last_name}_Resume.pdf",
                    file=f"resumes/{u.id}/resume.pdf",
                    file_type='PDF',
                    is_primary=True
                )
                score_base = 65 + min(25, (sp.semester or 1) * 3) + random.randint(-5, 5)
                ResumeAnalysis.objects.create(
                    resume=res,
                    analysis_version="1.0",
                    score=Decimal(str(min(96.0, max(55.0, score_base)))),
                    extracted_skills=list(cfg['skill_names'][:5]),
                    missing_skills=["Kubernetes", "GraphQL", "Redis"],
                    suggestions=["Highlight quantifiable metrics in project sections.", "Detail system architecture and load testing results."],
                    experience_summary=f"Undergraduate student in {dept_c} with core technical and engineering competencies.",
                    education_summary="Institute of Technology, Nirma University - Bachelor of Technology"
                )

        self.stdout.write(self.style.SUCCESS(f"Normalized and enriched {existing_students.count()} existing students."))

        # =========================================================================
        # PHASE 2: NORMALIZE EXISTING ALUMNI (Company, Identity, Experience, Skills)
        # =========================================================================
        self.stdout.write("--- Phase 2: Normalizing & Enriching Existing Alumni ---")
        existing_alumni = AlumniProfile.objects.select_related('user', 'department', 'batch').all()
        
        for ap in existing_alumni:
            u = ap.user
            dept_c = ap.department.code.upper() if ap.department else 'CSE'
            cfg = DEPT_CONFIG.get(dept_c, DEPT_CONFIG['CSE'])
            
            ap_updated = False
            if not ap.bio:
                ap.bio = f"Experienced {ap.current_job_title or 'Engineer'} alumnus from Nirma University ({dept_c}). Enthusiastic about mentoring juniors and campus hiring."
                ap_updated = True
            if not ap.phone:
                ap.phone = f"+91 {random.randint(7000000000, 9999999999)}"
                ap_updated = True
            if not ap.location:
                ap.location = random.choice(CITIES)
                ap_updated = True
            if not ap.current_company and all_companies:
                ap.current_company = random.choice(all_companies)
                ap_updated = True
            if not ap.current_job_title:
                job_title, job_cat = random.choice(ALUMNI_JOB_TITLES)
                ap.current_job_title = job_title
                ap.job_category = job_cat
                ap_updated = True
            
            # Experience accurate to graduation batch
            end_year = ap.batch.end_year if ap.batch else 2022
            exp = max(1, 2026 - end_year)
            if ap.years_of_experience != exp:
                ap.years_of_experience = exp
                ap_updated = True
            
            if ap_updated:
                ap.save()

            enrich_user_extensions(u, dept_c, is_alumni=True)

            # Ensure matching UniversityIdentity
            adm_year = (ap.batch.start_year if ap.batch else 2018)
            roll_pfx = cfg.get('roll_prefix', 'bce')
            old_email = generate_alumni_uni_email(adm_year + 4, roll_pfx)
            
            dob_year = adm_year - 18
            dob = date(dob_year, random.randint(1, 12), random.randint(1, 28))
            UniversityIdentity.objects.get_or_create(
                university_email=old_email,
                defaults={
                    'full_name': f"{u.first_name} {u.last_name}".strip(),
                    'date_of_birth': dob
                }
            )

        self.stdout.write(self.style.SUCCESS(f"Normalized and enriched {existing_alumni.count()} existing alumni."))

        # =========================================================================
        # PHASE 3: SEED MISSING SEMESTERS AND BATCHES
        # =========================================================================
        self.stdout.write("--- Phase 3: Seeding Targeted Students Across Every Department, Batch, and Semester ---")
        
        # Every department that must have students
        all_target_depts = [
            'CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'AIDS', 'BCH', 'BAM',
            'BCE', 'BEC', 'BME', 'BEE', 'BCV'
        ]

        # Cohort plan: (admission_year, semester, target_per_dept)
        # Year 2026: Semester 1 (1st Year)
        # Year 2025: Semester 2 (1st Year) & Semester 3 (2nd Year)
        # Year 2024: Semester 4 (2nd Year) & Semester 5 (3rd Year)
        # Year 2023: Semester 6 (3rd Year) & Semester 7 (4th Year)
        # Year 2022: Semester 8 (4th Year Final)
        cohort_matrix = [
            (2026, 1, 3), # ~42 students
            (2025, 2, 2), # ~28 students
            (2025, 3, 3), # ~42 students
            (2024, 4, 2), # ~28 students
            (2024, 5, 3), # ~42 students
            (2023, 6, 2), # ~28 students
            (2023, 7, 3), # ~42 students
            (2022, 8, 3), # ~42 students
        ]

        total_new_students = 0
        for adm_year, sem, target_per_dept in cohort_matrix:
            batch_obj = batches.get(adm_year)
            if not batch_obj:
                batch_obj, _ = Batch.objects.get_or_create(start_year=adm_year, end_year=adm_year+4, defaults={'is_active': True})
                batches[adm_year] = batch_obj

            for d_code in all_target_depts:
                dept_obj = departments.get(d_code)
                if not dept_obj:
                    continue
                cfg = DEPT_CONFIG.get(d_code, DEPT_CONFIG['CSE'])
                roll_pfx = cfg.get('roll_prefix', 'bce')

                for _ in range(target_per_dept):
                    email = generate_student_email(adm_year, roll_pfx)
                    first_name, last_name = generate_name()
                    
                    user = User.objects.create(
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        role='STUDENT',
                        is_verified=True,
                        is_active=True
                    )
                    user.set_password('password123')
                    user.save()

                    sp = StudentProfile.objects.create(
                        user=user,
                        department=dept_obj,
                        batch=batch_obj,
                        semester=sem,
                        bio=random.choice(cfg['bios']),
                        phone=f"+91 {random.randint(7000000000, 9999999999)}",
                        address=f"{random.choice(CITIES)}, Gujarat, India"
                    )

                    enrich_user_extensions(user, d_code, is_alumni=False, sem=sem)

                    # Resume & ATS Analysis for sem 3-8
                    if sem >= 3:
                        res = Resume.objects.create(
                            user=user,
                            title=f"{first_name}_{last_name}_Resume.pdf",
                            file=f"resumes/{user.id}/resume.pdf",
                            file_type='PDF',
                            is_primary=True
                        )
                        score_val = 60 + (sem * 4) + random.randint(-4, 4)
                        ResumeAnalysis.objects.create(
                            resume=res,
                            analysis_version="1.0",
                            score=Decimal(str(min(95.0, max(58.0, score_val)))),
                            extracted_skills=list(cfg['skill_names'][:5]),
                            missing_skills=["Docker", "Redis", "System Design"],
                            suggestions=["Expand on open source and collaborative engineering projects."],
                            experience_summary=f"Undergraduate {d_code} student actively preparing for campus recruitment.",
                            education_summary="Institute of Technology, Nirma University"
                        )

                    # Placements & Internships
                    if sem in (5, 6) and random.random() < 0.5:
                        # Internship
                        comp = random.choice(all_companies)
                        pkg = Decimal(str(round(random.uniform(2.5, 7.5), 1)))
                        StudentPlacementRecord.objects.get_or_create(
                            student=sp, company=comp, placement_year=2025,
                            defaults={
                                'offer_type': 'INTERNSHIP',
                                'hiring_mode': random.choice(['ON_CAMPUS', 'PPO', 'OFF_CAMPUS']),
                                'job_category': cfg['job_category'],
                                'package_lpa': pkg,
                                'job_title': 'Software Engineering Intern' if cfg['job_category'] == 'SOFTWARE' else 'Graduate Engineering Trainee'
                            }
                        )
                    elif sem in (7, 8) and random.random() < 0.8:
                        # Full time placement
                        comp = random.choice(all_companies)
                        # Tier based package
                        if comp.company_tier == 'SUPER_DREAM':
                            pkg = Decimal(str(round(random.uniform(20.0, 44.0), 1)))
                        elif comp.company_tier == 'UNICORN':
                            pkg = Decimal(str(round(random.uniform(14.0, 24.0), 1)))
                        elif comp.company_tier == 'DREAM':
                            pkg = Decimal(str(round(random.uniform(9.0, 16.0), 1)))
                        elif comp.company_tier == 'CORE':
                            pkg = Decimal(str(round(random.uniform(6.5, 13.0), 1)))
                        else:
                            pkg = Decimal(str(round(random.uniform(4.5, 8.5), 1)))

                        StudentPlacementRecord.objects.get_or_create(
                            student=sp, company=comp, placement_year=2025,
                            defaults={
                                'offer_type': 'FULL_TIME_PLACEMENT',
                                'hiring_mode': random.choice(['ON_CAMPUS', 'PPO', 'OFF_CAMPUS']),
                                'job_category': cfg['job_category'],
                                'package_lpa': pkg,
                                'job_title': 'Software Development Engineer' if cfg['job_category'] == 'SOFTWARE' else 'Graduate Engineer'
                            }
                        )

                    total_new_students += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total_new_students} new students across all 8 semesters and departments!"))

        # =========================================================================
        # PHASE 4: SEED MISSING ALUMNI (Departments with 0 Alumni like BCH, BAM, etc.)
        # =========================================================================
        self.stdout.write("--- Phase 4: Seeding Under-Represented Department Alumni ---")
        underrep_depts = ['BCH', 'BAM', 'BCE', 'BEC', 'BME', 'BEE', 'BCV']
        alumni_batches_list = [batches[y] for y in [2016, 2017, 2018, 2019, 2020, 2021] if y in batches]
        
        total_new_alumni = 0
        for d_code in underrep_depts:
            dept_obj = departments.get(d_code)
            if not dept_obj:
                continue
            cfg = DEPT_CONFIG.get(d_code, DEPT_CONFIG['CSE'])
            roll_pfx = cfg.get('roll_prefix', 'bce')

            for b_obj in alumni_batches_list:
                for _ in range(2):
                    first_name, last_name = generate_name()
                    email_username = f"{first_name.lower()}.{last_name.lower()}{random.randint(10,99)}@gmail.com"
                    while email_username in existing_emails:
                        email_username = f"{first_name.lower()}.{last_name.lower()}{random.randint(100,999)}@gmail.com"
                    existing_emails.add(email_username)

                    user = User.objects.create(
                        email=email_username,
                        first_name=first_name,
                        last_name=last_name,
                        role='ALUMNI',
                        is_verified=True,
                        is_active=True
                    )
                    user.set_password('password123')
                    user.save()

                    job_title, job_cat = random.choice(ALUMNI_JOB_TITLES)
                    exp = max(1, 2026 - b_obj.end_year)
                    comp = random.choice(all_companies)

                    ap = AlumniProfile.objects.create(
                        user=user,
                        department=dept_obj,
                        batch=b_obj,
                        current_company=comp,
                        current_job_title=job_title,
                        job_category=job_cat,
                        years_of_experience=exp,
                        bio=f"Alumnus from Nirma University ({d_code}, Batch {b_obj.start_year}-{b_obj.end_year}). Currently working as {job_title} at {comp.name}.",
                        phone=f"+91 {random.randint(7000000000, 9999999999)}",
                        location=random.choice(CITIES)
                    )

                    enrich_user_extensions(user, d_code, is_alumni=True)

                    # Historical Master Record in UniversityIdentity
                    old_uni_email = generate_alumni_uni_email(b_obj.end_year, roll_pfx)
                    dob_year = b_obj.start_year - 18
                    UniversityIdentity.objects.get_or_create(
                        university_email=old_uni_email,
                        defaults={
                            'full_name': f"{first_name} {last_name}".strip(),
                            'date_of_birth': date(dob_year, random.randint(1, 12), random.randint(1, 28))
                        }
                    )
                    total_new_alumni += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total_new_alumni} new alumni across under-represented departments!"))

        # =========================================================================
        # PHASE 5: COMMUNITY ENGAGEMENT (Interview Experiences & Quality Posts)
        # =========================================================================
        self.stdout.write("--- Phase 5: Seeding Community Experiences & Interactive Posts ---")
        all_active_users = list(User.objects.filter(is_active=True))
        tech_tags = list(Tag.objects.all())
        
        # Add realistic interview experiences
        interview_companies = [c for c in all_companies if c.company_tier in ('SUPER_DREAM', 'UNICORN', 'DREAM')]
        for _ in range(40):
            author = random.choice(all_active_users)
            comp = random.choice(interview_companies if interview_companies else all_companies)
            
            exp = InterviewExperience.objects.create(
                author=author,
                company=comp,
                experience_type=random.choice(['PLACEMENT', 'INTERNSHIP']),
                result=random.choice(['SELECTED', 'SELECTED', 'NOT_SELECTED']),
                difficulty=random.choice(['MEDIUM', 'HARD']),
                experience=f"Interview process at {comp.name} was comprehensive and well-structured. Evaluators emphasized clean coding, edge-case analysis, and core engineering fundamentals.",
                preparation="Focused on LeetCode Medium/Hard problems, NeetCode 150, system design primers, and simulated mock interviews."
            )

            InterviewRound.objects.create(
                interview_experience=exp,
                round_number=1,
                round_type='ONLINE_ASSESSMENT',
                duration_minutes=90,
                topics="3 DSA Questions (Graphs, Dynamic Programming, Strings) + 20 CS Fundamental MCQs",
                description="Timed coding assessment on HackerRank platform."
            )
            InterviewRound.objects.create(
                interview_experience=exp,
                round_number=2,
                round_type='TECHNICAL',
                duration_minutes=60,
                topics="Data Structures, Live Problem Solving, Time Complexity Analysis",
                description="Live video call with senior engineer solving algorithm questions."
            )
            InterviewRound.objects.create(
                interview_experience=exp,
                round_number=3,
                round_type='HR',
                duration_minutes=30,
                topics="Behavioral Questions, Cultural Alignment, Relocation, Compensation",
                description="Discussion with HR manager on career goals and values."
            )

        # Add community posts with comments and likes
        sample_post_data = [
            ("Cracking Top Tier Tech: Comprehensive Preparation Roadmap", "Sharing my exact strategy that helped me secure offers from Google and Amazon. Focus on mastering tree traversals, dynamic programming patterns, and low-level system design. Consistency is key!", "PLACEMENT_EXPERIENCE"),
            ("Campus Placement Guidance for Core Engineering Branches", "Mechanical and Electrical folks: do not neglect programming fundamentals and simulation tools. Companies like L&T and Siemens test both core fundamentals and analytical problem-solving.", "CAREER_ADVICE"),
            ("Open Source Contributions: The Best Way to Stand Out", "If you lack tier-1 internships on your resume, open-source is your golden ticket. Start with documentation fixes, then tackle good first issues on popular repositories.", "GENERAL"),
            ("Off-Campus Hiring Strategy for 2025/2026 Batch", "Referrals are 10x more effective than cold job board applications. Reach out to verified AlumiBridge alumni with your ATS-friendly resume and a concise intro note.", "PLACEMENT_EXPERIENCE"),
            ("Demystifying System Design: From Monoliths to Microservices", "A quick guide on caching strategies (Redis), message queues (Kafka), and database sharding for junior and senior students facing technical design rounds.", "CAREER_ADVICE")
        ]

        for title, content, ptype in sample_post_data:
            author = random.choice(all_active_users)
            post = Post.objects.create(
                author=author,
                post_type=ptype,
                title=title,
                content=content
            )
            if tech_tags:
                for t in random.sample(tech_tags, min(2, len(tech_tags))):
                    PostTag.objects.create(post=post, tag=t)

            # Add comments
            for _ in range(random.randint(2, 5)):
                Comment.objects.create(
                    post=post,
                    author=random.choice(all_active_users),
                    content=random.choice([
                        "Super helpful guide! Thanks for sharing your insights.",
                        "Could you share more details about the round 2 technical questions?",
                        "Congratulations! Inspiring roadmap for 3rd year students.",
                        "Completely agree on the open-source point. It made all the difference in my interviews."
                    ])
                )
            # Add likes
            for _ in range(random.randint(5, 15)):
                try:
                    PostLike.objects.create(post=post, user=random.choice(all_active_users))
                except:
                    pass

        self.stdout.write(self.style.SUCCESS("Community posts, comments, and interview experiences seeded successfully!"))

        # =========================================================================
        # SUMMARY AND VERIFICATION
        # =========================================================================
        self.stdout.write("\n=== CENSUS SUMMARY ===")
        from django.db.models import Count
        self.stdout.write(f"Total Users: {User.objects.count()}")
        self.stdout.write(f"Total Student Profiles: {StudentProfile.objects.count()}")
        self.stdout.write(f"Total Alumni Profiles: {AlumniProfile.objects.count()}")
        self.stdout.write(f"Total University Identies: {UniversityIdentity.objects.count()}")
        self.stdout.write(f"Total Resumes: {Resume.objects.count()}")
        self.stdout.write(f"Total Placement Records: {StudentPlacementRecord.objects.count()}")
        self.stdout.write(f"Total Interview Experiences: {InterviewExperience.objects.count()}")

        self.stdout.write("\nStudents by Semester:")
        for s in StudentProfile.objects.values('semester').annotate(c=Count('id')).order_by('semester'):
            self.stdout.write(f"  Semester {s['semester']}: {s['c']} students")

        self.stdout.write("\nStudents by Department:")
        for d in StudentProfile.objects.values('department__code', 'department__name').annotate(c=Count('id')).order_by('-c'):
            self.stdout.write(f"  {d['department__code']} ({d['department__name']}): {d['c']} students")

        self.stdout.write(self.style.SUCCESS("\n*** Institutional Master Census Seeding Completed Successfully! ***"))
