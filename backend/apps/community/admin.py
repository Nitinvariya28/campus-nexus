from django.contrib import admin
from .models import Post, PostMedia, Comment, PostLike, Tag, PostTag, SavedPost

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "post_type", "title", "created_at")
    list_filter = ("post_type",)
    search_fields = ("author__email", "title", "content")
    ordering = ("-created_at",)

@admin.register(PostMedia)
class PostMediaAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "media_type")
    list_filter = ("media_type",)
    search_fields = ("post__title",)
    ordering = ("-id",)

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "author", "created_at")
    search_fields = ("author__email", "content")
    ordering = ("-created_at",)

@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user")
    search_fields = ("user__email",)
    ordering = ("-id",)

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(PostTag)
class PostTagAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "tag")
    list_filter = ("tag",)
    search_fields = ("tag__name", "post__title")
    ordering = ("-id",)

@admin.register(SavedPost)
class SavedPostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post", "saved_at")
    search_fields = ("user__email", "post__title")
    ordering = ("-saved_at",)
