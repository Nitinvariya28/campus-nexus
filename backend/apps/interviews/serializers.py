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
    rounds = InterviewRoundCreateSerializer(many=True, required=False, default=list)

    class Meta:
        model = InterviewExperience
        fields = [
            'company_id', 'role_id', 'experience_type', 'result',
            'difficulty', 'experience', 'preparation', 'rounds'
        ]

    def create(self, validated_data):
        rounds_data = validated_data.pop('rounds', [])
        experience = InterviewExperience.objects.create(**validated_data)

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
