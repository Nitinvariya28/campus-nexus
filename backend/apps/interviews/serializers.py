from rest_framework import serializers
from .models import InterviewExperience, InterviewRound

class InterviewRoundCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewRound
        fields = [
            'round_number', 'round_type', 'mode', 'duration_minutes',
            'topics', 'description'
        ]

class InterviewExperienceCreateSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField()
    role_id = serializers.IntegerField(required=False, allow_null=True)
    role_title = serializers.CharField(required=False, allow_blank=True, write_only=True)
    rounds = InterviewRoundCreateSerializer(many=True, required=False, default=list)

    class Meta:
        model = InterviewExperience
        fields = [
            'company_id', 'role_id', 'role_title', 'experience_type', 'result',
            'difficulty', 'experience', 'preparation', 'rounds'
        ]

    def create(self, validated_data):
        rounds_data = validated_data.pop('rounds', [])
        role_id = validated_data.pop('role_id', None)
        role_title = validated_data.pop('role_title', None)
        company_id = validated_data.get('company_id')

        # Auto-match or create CompanyRole if role_id not provided but role_title is
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

        experience = InterviewExperience.objects.create(role_id=role_id, **validated_data)

        for round_data in rounds_data:
            InterviewRound.objects.create(interview_experience=experience, **round_data)

        return experience

    def update(self, instance, validated_data):
        rounds_data = validated_data.pop('rounds', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if rounds_data is not None:
            instance.rounds.all().delete()
            for round_data in rounds_data:
                InterviewRound.objects.create(interview_experience=instance, **round_data)

        return instance
