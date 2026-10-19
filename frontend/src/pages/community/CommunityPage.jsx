import React, { useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import CommunityLayout from '../../components/community/layout/CommunityLayout';
import { Rss, FileText, Settings, Plus, CheckCircle2, Filter, ArrowLeft, Bookmark } from 'lucide-react';
import RoleBadgePill from '../../components/community/common/RoleBadgePill';
import CommunityFeedStream from '../../components/community/feed/CommunityFeedStream';
import UserProfileView from '../../components/community/profile/UserProfileView';

import CreatePostModal from '../../components/community/modals/CreatePostModal';
import DeleteConfirmModal from '../../components/community/modals/DeleteConfirmModal';
import { deleteCommunityPost } from '../../services/community/communityService';
import { useCommunityStats } from '../../context/CommunityStatsContext';

/**
 * CommunityPage Component
 * Orchestrates the main content area based on the selected navigation view:
 * - /community -> Community Feed (with top filter pills, search bar, and right sidebar)
 * - /community?user=<id> -> LinkedIn-Style User Profile View on the SAME page
 * - /community/create -> Create Post View
 * - /community/my-posts -> Your Posts View
 * - /community/saved -> Saved Posts View
 * - /community/manage -> Manage Your Posts View
 */
export default function CommunityPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active post-type filters (supports multi-selection per docx Section 4.1)
  const activeTypes = searchParams.get('types')?.split(',').filter(Boolean) || ['ALL'];
  const viewingUserId = searchParams.get('user');

  const isCreate = location.pathname.includes('/create');
  const isMyPosts = location.pathname.includes('/my-posts');
  const isSaved = location.pathname.includes('/saved');
  const isManage = location.pathname.includes('/manage');

  const { adjustPosts } = useCommunityStats();
  const [postToEdit, setPostToEdit] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [feedReloadKey, setFeedReloadKey] = useState(0);

  const handleSelectUser = (userId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('user', userId);
    setSearchParams(nextParams);
  };

  const handleBackToFeed = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('user');
    setSearchParams(nextParams);
  };

  const handleEditPost = (post) => {
    setPostToEdit(post);
  };

  const handleDeletePost = (post) => {
    setDeleteError(null);
    setPostToDelete(post);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete?.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const entityType = postToDelete.feed_type || postToDelete.entity_type || 'POST';
      await deleteCommunityPost(postToDelete.id, entityType);
      adjustPosts?.(-1);
      setPostToDelete(null);
      setFeedReloadKey((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete post:', err);
      setDeleteError(err?.response?.data?.error || err.message || 'Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostUpdated = () => {
    setPostToEdit(null);
    setFeedReloadKey((prev) => prev + 1);
  };

  // View: Same-Page LinkedIn-Style User Profile View
  if (viewingUserId) {
    return (
      <CommunityLayout onSelectUser={handleSelectUser}>
        <UserProfileView
          userId={viewingUserId}
          onBack={handleBackToFeed}
        />
      </CommunityLayout>
    );
  }

  // View 2: Create Post Form View (Role-adaptive with horizontal option carousel)
  if (isCreate) {
    return (
      <CommunityLayout onSelectUser={handleSelectUser}>
        <CreatePostModal isStandalonePage={true} />
      </CommunityLayout>
    );
  }

  // View 3: Your Posts View
  if (isMyPosts) {
    return (
      <CommunityLayout onSelectUser={handleSelectUser}>
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Your Posts</h1>
              </div>
            </div>
            <Link
              to="/community"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Feed</span>
            </Link>
          </div>

          {/* Author Feed Stream */}
          <CommunityFeedStream
            authorId="me"
            onUserClick={handleSelectUser}
            onResetFilters={() => {}}
          />
        </div>
      </CommunityLayout>
    );
  }

  // View 4: Saved Posts View
  if (isSaved) {
    return (
      <CommunityLayout onSelectUser={handleSelectUser}>
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Saved Posts</h1>
              </div>
            </div>
            <Link
              to="/community"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Feed</span>
            </Link>
          </div>

          {/* Saved Posts Feed Stream */}
          <CommunityFeedStream
            isSaved={true}
            onUserClick={handleSelectUser}
            onResetFilters={() => {}}
          />
        </div>
      </CommunityLayout>
    );
  }

  // View 5: Manage Your Posts View (CRUD)
  if (isManage) {
    return (
      <CommunityLayout onSelectUser={handleSelectUser}>
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Manage Your Posts</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edit or delete any of your published updates, opportunities, and interview experiences.
                </p>
              </div>
            </div>
            <Link
              to="/community"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Feed</span>
            </Link>
          </div>

          {/* Author Feed Stream with Manage Controls (3-dots menu active only here) */}
          <CommunityFeedStream
            authorId="me"
            isManageMode={true}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onUserClick={handleSelectUser}
            reloadKey={feedReloadKey}
            emptyTitle="No Posts to Manage"
            emptyMessage="You have not published any posts or opportunities yet. Once created, your posts will appear here with edit and delete options."
          />

          {/* Edit Post Modal */}
          {postToEdit && (
            <CreatePostModal
              isOpen={Boolean(postToEdit)}
              onClose={() => setPostToEdit(null)}
              initialPost={postToEdit}
              mode="edit"
              onPostUpdated={handlePostUpdated}
            />
          )}

          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal
            isOpen={Boolean(postToDelete)}
            onClose={() => {
              if (!isDeleting) setPostToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
            postTitle={
              postToDelete?.title ||
              postToDelete?.role_title ||
              (postToDelete?.company ? `${postToDelete.company} Experience` : 'Selected Post')
            }
            errorMessage={deleteError}
          />
        </div>
      </CommunityLayout>
    );
  }

  // View 1: Community Feed (Default)
  return (
    <CommunityLayout onSelectUser={handleSelectUser}>
      <CommunityFeedStream
        roles={activeTypes}
        onUserClick={handleSelectUser}
        onResetFilters={() => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('types');
          setSearchParams(nextParams);
        }}
      />
    </CommunityLayout>
  );
}
