# LearnedCircle

LearnedCircle is a legal help, lawyer networking, forum, publishing, job, advertising and premium membership platform for `learnedcircle.com`.

## Project Structure

- `outputs/` contains the static site, public assets, Vercel API routes and Supabase schema.
- `outputs/index.html` is the main public website.
- `outputs/account.html` is the user account and profile submission interface.
- `outputs/admin.html` is the moderation and publishing desk.
- `outputs/trust.html` and `outputs/legal.html` contain public trust, verification, privacy and legal terms.
- `scripts/` contains deployment, Supabase migration and verification helpers.

## Deployment

The project is deployed on Vercel. Required production environment variables are stored in Vercel, not in this repository.

Required environment variables include:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `MODERATION_EMAIL`
- `MODERATION_FROM_EMAIL`
- `ADMIN_ACCESS_CODE`

## Notes

Do not commit local `.env` files, API tokens, service-role keys or payment provider secrets.

