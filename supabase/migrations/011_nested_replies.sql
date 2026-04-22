-- Support for nested replies (replies to replies)
-- Allows multi-level comment threads (3+ levels deep)

-- Add parent_id to replies table to support replies-to-replies
ALTER TABLE replies ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES replies(id) ON DELETE CASCADE;

-- Create index for faster parent lookup
CREATE INDEX IF NOT EXISTS idx_replies_parent_id ON replies(parent_id);

-- Update comment to note that parent_id takes precedence
-- If parent_id is set, this reply is a reply-to-reply
-- If parent_id is null, this reply is a direct reply to a comment
COMMENT ON COLUMN replies.parent_id IS 'If set, this reply is a reply-to-another-reply. If null, this is a direct reply to a comment.';

-- No RLS changes needed — existing policies still apply (authenticated users can read, own user can write)
