-- Migration to update student name and nickname
UPDATE public.students 
SET nickname = 'Hugo', 
    full_name = 'Hugo Henrik' 
WHERE id = '4dddfb10-c9d5-49b6-b658-b34d5d63f412';
