-- Check user ngocthien
SELECT id, username, role FROM users WHERE username = 'ngocthien';

-- Check bookings for user ID (replace with actual ID from above)
SELECT 
    b.id as booking_id,
    b.user_id,
    u.username,
    b.status,
    b.tour_id,
    t.title as tour_title,
    ta.id as assignment_id,
    ta.tour_guide_id
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN tours t ON b.tour_id = t.id
LEFT JOIN tour_assignments ta ON b.id = ta.booking_id
WHERE b.user_id = 11  -- User ID from console log
ORDER BY b.id DESC;

-- Check all bookings
SELECT 
    b.id,
    b.user_id,
    u.username,
    b.status,
    ta.id as has_assignment
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN tour_assignments ta ON b.id = ta.booking_id
ORDER BY b.id DESC
LIMIT 20;
