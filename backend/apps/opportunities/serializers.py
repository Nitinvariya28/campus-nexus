from rest_framework import serializers
from .models import Opportunity, OpportunitySkill
from apps.skills.models import Skill

class OpportunitySkillCreateSerializer(serializers.Serializer):
    skill_id = serializers.IntegerField()
    importance = serializers.ChoiceField(choices=OpportunitySkill.IMPORTANCE_CHOICES)

class OpportunityCreateSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField()
    role_id = serializers.IntegerField(required=False, allow_null=True)
    eligible_departments = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    eligible_batches = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    skills = OpportunitySkillCreateSerializer(many=True, required=False, default=list)

    class Meta:
        model = Opportunity
        fields = [
            'opportunity_type', 'title', 'description', 'location', 'work_mode', 
            'employment_type', 'salary_package', 'min_cgpa', 'application_url', 
            'deadline', 'status', 'company_id', 'role_id', 'eligible_departments', 
            'eligible_batches', 'skills'
        ]

    def create(self, validated_data):
        departments = validated_data.pop('eligible_departments', [])
        batches = validated_data.pop('eligible_batches', [])
        skills_data = validated_data.pop('skills', [])

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
