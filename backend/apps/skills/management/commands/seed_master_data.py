from django.core.management.base import BaseCommand
from apps.skills.models import SkillCategory, Skill, MasterLearningPlatform
from apps.companies.models import Company

class Command(BaseCommand):
    help = 'Seeds the database with Master Reference Data (Skills, Platforms, Companies) without deleting existing records.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting Phase 1: Seeding Master Data..."))

        # --- 1. SEED SKILLS ---
        SKILL_DATA = {
            "PROGRAMMING_LANGUAGE": [
                "Python", "Java", "C++", "C", "JavaScript", "TypeScript", "C#", "Go (Golang)", 
                "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Dart", "R", "MATLAB", "Scala", 
                "Perl", "Haskell", "Objective-C"
            ],
            "WEB_FRAMEWORK": [
                "React.js", "Angular", "Vue.js", "Next.js", "Svelte", "Django", "Flask", 
                "FastAPI", "Spring Boot", "Express.js", "NestJS", "Ruby on Rails", "Laravel", 
                "ASP.NET Core", "React Native", "Flutter", "Tailwind CSS", "Bootstrap", 
                "Nuxt.js", "jQuery"
            ],
            "DATABASE": [
                "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis", "Oracle Database", 
                "Microsoft SQL Server", "Cassandra", "Amazon DynamoDB", "Firebase Realtime Database", 
                "Firestore", "MariaDB", "Elasticsearch", "Neo4j (Graph DB)", "CouchDB", 
                "Supabase", "Snowflake", "Amazon Redshift", "IBM Db2", "ArangoDB"
            ],
            "CLOUD_TOOL": [
                "Amazon Web Services (AWS)", "Google Cloud Platform (GCP)", "Microsoft Azure", 
                "Docker", "Kubernetes", "Jenkins", "GitHub Actions", "GitLab CI/CD", "Terraform", 
                "Ansible", "Prometheus", "Grafana", "Nginx", "Apache HTTP Server", "Vercel", 
                "Heroku", "Netlify", "DigitalOcean", "CircleCI", "Travis CI"
            ],
            "CORE_SUBJECT": [
                "Data Structures & Algorithms (DSA)", "Object-Oriented Programming (OOP)", 
                "Database Management Systems (DBMS)", "Operating Systems (OS)", "Computer Networks", 
                "System Design", "Software Engineering", "Theory of Computation (TOC)", 
                "Compiler Design", "Artificial Intelligence", "Machine Learning", "Cryptography", 
                "Computer Architecture", "Microprocessors", "Web Technologies"
            ],
            "CERTIFICATION": [
                "AWS Certified Solutions Architect", "Google Cloud Professional Cloud Architect", 
                "Microsoft Certified: Azure Developer", "CISSP (Cybersecurity)", 
                "CEH (Certified Ethical Hacker)", "PMP (Project Management Professional)", 
                "Certified ScrumMaster (CSM)", "CompTIA Security+", "Cisco CCNA / CCNP", 
                "Oracle Certified Professional", "CISA (Certified Information Systems Auditor)", 
                "ITIL 4 Foundation", "Salesforce Certified Developer", 
                "HashiCorp Certified: Terraform Associate", "Certified Kubernetes Administrator (CKA)"
            ]
        }

        for cat_type, skills in SKILL_DATA.items():
            cat_name = cat_type.replace("_", " ").title()
            category, created = SkillCategory.objects.get_or_create(name=cat_name)
            category.category_type = cat_type
            category.save()
            
            for skill_name in skills:
                Skill.objects.get_or_create(category=category, name=skill_name)
        
        self.stdout.write(self.style.SUCCESS("Successfully seeded Skills & Categories!"))

        # --- 2. SEED LEARNING PLATFORMS ---
        PLATFORM_DATA = {
            "YOUTUBE_CHANNEL": [
                "CodeWithHarry", "Harkirat Singh (100xDevs)", "Striver (Take U Forward)", 
                "Love Babbar", "Apna College", "freeCodeCamp.org", "Traversy Media", 
                "The Net Ninja", "Fireship", "Programming with Mosh", "NeetCode", "Abdul Bari", 
                "Jenny's Lectures CS IT", "Web Dev Simplified", "Clever Programmer", "Academind", 
                "CS50 (Harvard)", "Lex Fridman", "Sentdex", "Programming Hero"
            ],
            "CODING_PLATFORM": [
                "LeetCode", "GeeksforGeeks", "Codeforces", "CodeChef", "HackerRank", "HackerEarth", 
                "InterviewBit", "AtCoder", "Spoj", "TopCoder", "Codewars", "Kaggle", 
                "Coding Ninjas", "Edabit", "Project Euler", "AlgoExpert", "Structy", 
                "CSSBattle", "Front End Mentor"
            ],
            "COURSE_WEBSITE": [
                "Coursera", "Udemy", "edX", "Pluralsight", "Udacity", "Educative.io", 
                "Codecademy", "NPTEL / Swayam", "Datacamp", "Skillshare", "LinkedIn Learning", 
                "O'Reilly Media", "Frontend Masters", "Scrimba", "Khan Academy", "Simplilearn", 
                "Great Learning", "Maven", "Treehouse", "MIT OpenCourseWare"
            ]
        }

        for p_type, platforms in PLATFORM_DATA.items():
            for p_name in platforms:
                MasterLearningPlatform.objects.get_or_create(
                    platform_type=p_type, name=p_name
                )
        
        self.stdout.write(self.style.SUCCESS("Successfully seeded Learning Platforms!"))

        # --- 3. SEED COMPANIES ---
        COMPANY_DATA = {
            "SUPER_DREAM": ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "LinkedIn", "Uber"],
            "DREAM": ["Atlassian", "Salesforce", "Adobe", "Goldman Sachs", "Morgan Stanley", "Intuit", "PayPal", "Cisco"],
            "REGULAR": ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini", "Tech Mahindra", "IBM", "HCL"],
            "UNICORN": ["Stripe", "Airbnb", "Razorpay", "Cred", "Swiggy", "Zomato", "Postman", "Zerodha"]
        }
        
        for tier, companies in COMPANY_DATA.items():
            for c_name in companies:
                Company.objects.get_or_create(
                    name=c_name,
                    defaults={"company_tier": tier, "company_size": "ENTERPRISE"}
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded Master Companies!"))
        self.stdout.write(self.style.SUCCESS("PHASE 1 COMPLETE. Database is perfectly primed for user seeding."))
