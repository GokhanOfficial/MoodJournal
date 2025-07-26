-- This migration creates a view to simplify querying user achievements with their details.

CREATE OR REPLACE VIEW public.user_achievements_with_details AS
SELECT
    ua.user_id,
    ua.achievement_id,
    ua.is_completed,
    ua.unlocked_at,
    ua.progress_value,
    a.name AS achievement_name,
    a.description AS achievement_description,
    a.icon AS achievement_icon,
    a.category AS achievement_category,
    a.type AS achievement_type,
    a.target_value,
    a.target_decimal,
    a.rarity,
    a.points,
    a.sort_order
FROM
    public.user_achievements ua
JOIN
    public.achievements a ON ua.achievement_id = a.id;

-- Grant usage to authenticated role so the app can query it.
GRANT SELECT ON public.user_achievements_with_details TO authenticated;
GRANT SELECT ON public.user_achievements_with_details TO service_role;