-- Check all data counts
SELECT 'characters' as table_name, COUNT(*) as count FROM public.characters
UNION ALL
SELECT 'cards', COUNT(*) FROM public.cards
UNION ALL
SELECT 'pre_stories', COUNT(*) FROM public.pre_stories
UNION ALL
SELECT 'chance_scenes', COUNT(*) FROM public.chance_scenes
UNION ALL
SELECT 'scenarios (main)', COUNT(*) FROM public.scenarios WHERE phase = 'main_story'
UNION ALL
SELECT 'scenarios (reversal)', COUNT(*) FROM public.scenarios WHERE phase = 'reversal'
UNION ALL
SELECT 'gacha_config', COUNT(*) FROM public.gacha_config
UNION ALL
SELECT 'presentation_config', COUNT(*) FROM public.presentation_config
UNION ALL
SELECT 'countdown_patterns', COUNT(*) FROM public.countdown_patterns;
