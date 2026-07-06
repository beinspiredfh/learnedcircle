const SUPABASE_URL = process.env.SUPABASE_URL || "https://tnxdulqdfanzlawuonmf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_UxaC8agmrd3bAkxhxQRzXA_uOCvnyKd";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

async function supabasePublicFetch(path, useServiceKey = false) {
  const key = useServiceKey && SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY : SUPABASE_PUBLISHABLE_KEY;
  return fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    }
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const jobsResponse = await supabasePublicFetch(
    "/rest/v1/job_posts?select=id,title,organization,location,engagement_type,practice_areas,budget,description,created_at&status=eq.approved&order=created_at.desc&limit=20"
  );
  const jobs = await jobsResponse.json();

  if (!jobsResponse.ok) {
    response.status(jobsResponse.status).json({ ok: false, message: jobs.message || "Could not load public data." });
    return;
  }

  const articlesResponse = await supabasePublicFetch(
    "/rest/v1/articles?select=id,title,practice_area,summary,byline,created_at&status=eq.approved&order=created_at.desc&limit=20"
  );
  const articles = await articlesResponse.json();

  if (!articlesResponse.ok) {
    response.status(articlesResponse.status).json({ ok: false, message: articles.message || "Could not load public data." });
    return;
  }

  const advertsResponse = await supabasePublicFetch(
    "/rest/v1/advert_requests?select=id,organization,advert_type,target_audience,campaign_note,created_at&status=eq.approved&order=created_at.desc&limit=8",
    true
  );
  const adverts = await advertsResponse.json();

  if (!advertsResponse.ok) {
    response.status(advertsResponse.status).json({ ok: false, message: adverts.message || "Could not load public adverts." });
    return;
  }

  let advertPlacements = [];
  const placementResponse = await supabasePublicFetch(
    "/rest/v1/advert_placements?select=id,status,placement,label,headline,body,cta_label,cta_url,organization,starts_at,ends_at,created_at&status=eq.published&order=created_at.desc&limit=20",
    true
  );
  const placementRows = await placementResponse.json();

  if (placementResponse.ok) {
    const now = Date.now();
    advertPlacements = placementRows.filter((placement) => {
      const startsAt = placement.starts_at ? Date.parse(placement.starts_at) : null;
      const endsAt = placement.ends_at ? Date.parse(placement.ends_at) : null;
      return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
    });
  }

  let libraryResources = [];
  const libraryResponse = await supabasePublicFetch(
    "/rest/v1/library_resources?select=id,group_key,title,area,resource_type,source,summary,action_label,resource_url,file_url,file_name,file_type,created_at&status=eq.published&order=created_at.desc&limit=100",
    true
  );
  const libraryRows = await libraryResponse.json();

  if (libraryResponse.ok) {
    libraryResources = libraryRows;
  }

  let guestResponse = await supabasePublicFetch(
    "/rest/v1/guest_articles?select=id,title,contributor_name,contributor_title,contributor_image_url,approved_byline,summary,body,created_at&status=eq.approved&order=created_at.desc&limit=12",
    true
  );
  let guestArticles = await guestResponse.json();

  if (!guestResponse.ok && String(guestArticles.message || "").includes("contributor_image_url")) {
    guestResponse = await supabasePublicFetch(
      "/rest/v1/guest_articles?select=id,title,contributor_name,contributor_title,approved_byline,summary,body,created_at&status=eq.approved&order=created_at.desc&limit=12",
      true
    );
    guestArticles = await guestResponse.json();
  }

  if (!guestResponse.ok) {
    response.status(guestResponse.status).json({ ok: false, message: guestArticles.message || "Could not load public guest articles." });
    return;
  }

  const normalizedGuestArticles = guestArticles.map((article) => {
    const body = String(article.body || "");
    const imageMatch = body.match(/^Writer picture URL:\s*(https?:\/\/[^\n]+)\n\n/i);
    return {
      ...article,
      writer_picture_url: article.contributor_image_url || (imageMatch ? imageMatch[1] : ""),
      body: body.replace(/^Writer picture URL:\s*https?:\/\/[^\n]+\n\n/i, "")
    };
  });

  const onlineSince = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const approvedLawyersResponse = await supabasePublicFetch(
    "/rest/v1/lawyer_profiles?select=id,display_name,credentials,year_of_call,supreme_court_number,show_call_details_public,location,firm,practice_areas,languages,fees,availability,summary,verified,direct_client_contact,pro_bono_open,profile_picture_url,updated_at&verified=eq.true&order=updated_at.desc&limit=50",
    true
  );
  const approvedLawyers = await approvedLawyersResponse.json();

  if (!approvedLawyersResponse.ok) {
    response.status(approvedLawyersResponse.status).json({ ok: false, message: approvedLawyers.message || "Could not load approved lawyers." });
    return;
  }

  const lawyersResponse = await supabasePublicFetch(
    `/rest/v1/lawyer_profiles?select=id,display_name,credentials,location,practice_areas,fees,summary,verified,direct_client_contact,pro_bono_open,profile_picture_url,updated_at&verified=eq.true&updated_at=gte.${encodeURIComponent(onlineSince)}&order=updated_at.desc&limit=12`,
    true
  );
  const onlineLawyers = await lawyersResponse.json();

  if (!lawyersResponse.ok) {
    response.status(lawyersResponse.status).json({ ok: false, message: onlineLawyers.message || "Could not load online lawyers." });
    return;
  }

  const debateResponse = await supabasePublicFetch(
    "/rest/v1/forum_posts?select=id,title,body,created_at&status=eq.approved&practice_area=eq.Debate%20opinion&order=created_at.desc&limit=80",
    true
  );
  const rawDebateOpinions = await debateResponse.json();

  if (!debateResponse.ok) {
    response.status(debateResponse.status).json({ ok: false, message: rawDebateOpinions.message || "Could not load debate opinions." });
    return;
  }

  const debateOpinions = rawDebateOpinions.map((row) => {
    try {
      const body = JSON.parse(row.body || "{}");
      return {
        id: row.id,
        created_at: row.created_at,
        debateId: body.debateId || row.title,
        debateTitle: body.debateTitle || row.title,
        position: body.position || "Opinion",
        reason: body.reason || ""
      };
    } catch (error) {
      return {
        id: row.id,
        created_at: row.created_at,
        debateId: row.title,
        debateTitle: row.title,
        position: "Opinion",
        reason: row.body || ""
      };
    }
  }).filter((opinion) => opinion.debateId && opinion.reason);

  const forumRepliesResponse = await supabasePublicFetch(
    "/rest/v1/forum_posts?select=id,title,body,created_at&status=eq.approved&practice_area=eq.Forum%20reply&order=created_at.desc&limit=120",
    true
  );
  const rawForumReplies = await forumRepliesResponse.json();

  if (!forumRepliesResponse.ok) {
    response.status(forumRepliesResponse.status).json({ ok: false, message: rawForumReplies.message || "Could not load forum replies." });
    return;
  }

  const forumReplies = rawForumReplies.map((row) => {
    try {
      const body = JSON.parse(row.body || "{}");
      return {
        id: row.id,
        created_at: row.created_at,
        forumId: body.forumId || row.title,
        forumTitle: body.forumTitle || row.title,
        reply: body.reply || ""
      };
    } catch (error) {
      return {
        id: row.id,
        created_at: row.created_at,
        forumId: row.title,
        forumTitle: row.title,
        reply: row.body || ""
      };
    }
  }).filter((reply) => reply.forumId && reply.reply);

  const forumTopicsResponse = await supabasePublicFetch(
    "/rest/v1/forum_posts?select=id,title,practice_area,body,created_at&status=eq.approved&order=created_at.desc&limit=80",
    true
  );
  const rawForumTopics = await forumTopicsResponse.json();

  if (!forumTopicsResponse.ok) {
    response.status(forumTopicsResponse.status).json({ ok: false, message: rawForumTopics.message || "Could not load forum discussions." });
    return;
  }

  const forumTopics = rawForumTopics
    .filter((row) => !["Debate opinion", "Forum reply"].includes(row.practice_area))
    .map((row) => {
      try {
        const body = JSON.parse(row.body || "{}");
        return {
          id: row.id,
          created_at: row.created_at,
          forumId: body.forumId || row.id,
          title: body.forumTitle || row.title,
          practiceArea: body.practiceArea || row.practice_area || "General discussion",
          details: body.details || ""
        };
      } catch (error) {
        return {
          id: row.id,
          created_at: row.created_at,
          forumId: row.id,
          title: row.title,
          practiceArea: row.practice_area || "General discussion",
          details: row.body || ""
        };
      }
    })
    .filter((topic) => topic.forumId && topic.title);

  response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  response.status(200).json({
    ok: true,
    jobs,
    articles,
    adverts,
    advertPlacements,
    libraryResources,
    guestArticles: normalizedGuestArticles,
    approvedLawyers,
    onlineLawyers,
    debateOpinions,
    forumReplies,
    forumTopics
  });
};
