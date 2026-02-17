-- Allow anonymous users (guest checkout) to insert review requests
-- This is necessary because the frontend uses the anon key and users might not be logged in.

CREATE POLICY "Allow anonymous insert of review requests"
ON review_requests
FOR INSERT
TO anon
WITH CHECK (true);
