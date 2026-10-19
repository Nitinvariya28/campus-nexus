from rest_framework import serializers
from .models import Opportunity, OpportunitySkill
from apps.skills.models import Skill

class OpportunitySkillCreateSerializer(serializers.Serializer):
    skill_id = serializers.IntegerField()
    importance = serializers.ChoiceField(choices=OpportunitySkill.IMPORTANCE_CHOICES)

class OpportunityCreateSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField()
    role_id = serializers.IntegerField(required=False, allow_null=True)
    role_title = serializers.CharField(required=False, allow_blank=True, write_only=True)
    eligible_departments = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    eligible_batches = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    skills = OpportunitySkillCreateSerializer(many=True, required=False, default=list)

    class Meta:
        model = Opportunity
        fields = [
            'opportunity_type', 'title', 'description', 'location', 'work_mode', 
            'employment_type', 'salary_package', 'min_cgpa', 'application_url', 
            'deadline', 'status', 'company_id', 'role_id', 'role_title', 'eligible_departments', 
            'eligible_batches', 'skills'
        ]

    def create(self, validated_data):
        departments = validated_data.pop('eligible_departments', [])
        batches = validated_data.pop('eligible_batches', [])
        skills_data = validated_data.pop('skills', [])
        role_id = validated_data.get('role_id')
        role_title = validated_data.pop('role_title', None)
        company_id = validated_data.get('company_id')

        if not role_id and role_title:
            from apps.companies.models import CompanyRole
            role_obj = CompanyRole.objects.filter(company_id=company_id, role_name__iexact=role_title.strip()).first()
            if not role_obj:
                role_obj = CompanyRole.objects.create(
                    company_id=company_id,
                    role_name=role_title.strip(),
                    role_category='OTHER'
                )
            validated_data['role_id'] = role_obj.id

        opportunity = Opportunity.objects.create(**validated_data)

        if departments:
            opportunity.eligible_departments.set(departments)
        if batches:
            opportunity.eligible_batches.set(batches)
            
        for skill_data in skills_data:
            skill = Skill.objects.get(id=skill_data['skill_id'])
            OpportunitySkill.objects.create(
                opportunity=opportunity,
                skill=skill,
                importance=skill_data['importance']
            )

        return opportunity

    def update(self, instance, validated_data):
        departments = validated_data.pop('eligible_departments', None)
        batches = validated_data.pop('eligible_batches', None)
        skills_data = validated_data.pop('skills', None)
        role_id = validated_data.pop('role_id', None)
        role_title = validated_data.pop('role_title', None)
        company_id = validated_data.get('company_id', instance.company_id)

        if not role_id and role_title:
            from apps.companies.models import CompanyRole
            role_obj = CompanyRole.objects.filter(company_id=company_id, role_name__iexact=role_title.strip()).first()
            if not role_obj:
                role_obj = CompanyRole.objects.create(
                    company_id=company_id,
                    role_name=role_title.strip(),
                    role_category='OTHER'
                )
            role_id = role_obj.id

        if role_id is not None:
            instance.role_id = role_id

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if departments is not None:
            instance.eligible_departments.set(departments)
        if batches is not None:
            instance.eligible_batches.set(batches)

        if skills_data is not None:
            instance.opportunity_skills.all().delete()
            for skill_data in skills_data:
                skill = Skill.objects.get(id=skill_data['skill_id'])
                OpportunitySkill.objects.create(
                    opportunity=instance,
                    skill=skill,
                    importance=skill_data['importance']
                )

        return instance
