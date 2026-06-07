'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import TiptapEditor from '@/components/editor/tiptap-editor'

interface Comment {
  id: string
  comment_html: string
  comment_stripped: string | null
  created_at: string
  updated_at: string
  edited_at: string | null
  actor_id: string
  profiles?: {
    id: string
    display_name: string
    avatar_url?: string
  }
}

interface IssueCommentsProps {
  issueId: string
  projectId: string
  workspaceId: string
}

export default function IssueComments({
  issueId,
  projectId,
  workspaceId,
}: IssueCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; display_name: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchComments()
    fetchCurrentUser()
  }, [issueId])

  async function fetchCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('user_id', user.id)
        .single()
      if (profile) {
        setCurrentUser(profile)
      }
    }
  }

  async function fetchComments() {
    const { data, error } = await supabase
      .from('issue_comments')
      .select(`
        *,
        profiles (*)
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
    } else {
      setComments(data || [])
    }
    setLoading(false)
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || !currentUser) return
    setSubmitting(true)

    const { error } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: issueId,
        project_id: projectId,
        workspace_id: workspaceId,
        comment_html: newComment,
        comment_stripped: newComment.replace(/<[^>]*>/g, ''),
        actor_id: currentUser.id,
      })

    if (error) {
      console.error('Error creating comment:', error)
      alert('Failed to add comment')
    } else {
      setNewComment('')
      fetchComments()
    }

    setSubmitting(false)
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return

    const { error } = await supabase
      .from('issue_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    } else {
      fetchComments()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>

        {/* New Comment Form */}
        {currentUser && (
          <div className="space-y-3 mb-6">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {currentUser.display_name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <TiptapEditor
                  content={newComment}
                  onChange={setNewComment}
                  placeholder="Add a comment..."
                  editable
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submitting || !newComment.trim()}
                    size="sm"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id}>
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {comment.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {comment.profiles?.display_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      {comment.edited_at && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}
                    </div>
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: comment.comment_html }}
                    />
                    {comment.actor_id === currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
                {comment.id !== comments[comments.length - 1].id && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
