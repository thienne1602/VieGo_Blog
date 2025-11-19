# ✅ Tour Itinerary System - Deployment Checklist

## 🎯 Pre-Deployment Checklist

### Database Setup

- [ ] 1. Backup existing database

  ```bash
  mysqldump -u root -p viego_blog > backup_before_itinerary.sql
  ```

- [ ] 2. Run migration script

  ```bash
  setup_tour_itinerary.bat
  # OR manually:
  mysql -u root -p viego_blog < database\migrate_tour_itinerary_system.sql
  ```

- [ ] 3. Verify tables created

  ```sql
  USE viego_blog;
  SHOW TABLES LIKE '%itinerary%';
  -- Should show 5 tables
  ```

- [ ] 4. Check triggers
  ```sql
  SHOW TRIGGERS WHERE `Trigger` LIKE '%checkin%';
  -- Should show 2 triggers
  ```

### Backend Setup

- [ ] 5. Verify models import

  ```bash
  cd backend
  python
  >>> from models.tour_itinerary import TourItineraryTemplate
  >>> from models.booking_itinerary import CheckpointCheckin
  >>> # Should not throw errors
  ```

- [ ] 6. Check routes registration

  ```bash
  # Start backend and check logs
  run_backend.bat
  # Look for: "Routes registered successfully (including... itinerary)"
  ```

- [ ] 7. Create upload directory

  ```bash
  mkdir uploads\checkpoint_photos
  # OR let setup script create it
  ```

- [ ] 8. Set permissions on upload folder
  ```bash
  # Ensure web server can write to uploads/checkpoint_photos/
  ```

### API Testing

- [ ] 9. Test authentication

  ```bash
  POST /api/auth/login
  # Get tokens for: seller, tour_guide, customer
  ```

- [ ] 10. Test template creation (Seller)

  ```bash
  POST /api/itinerary/templates
  Authorization: Bearer {seller_token}
  ```

- [ ] 11. Test template retrieval

  ```bash
  GET /api/itinerary/templates/1
  ```

- [ ] 12. Test check-in (Tour Guide)

  ```bash
  POST /api/itinerary/checkins/1/checkin
  Authorization: Bearer {guide_token}
  ```

- [ ] 13. Test photo upload

  ```bash
  POST /api/itinerary/checkins/1/photos
  Content-Type: multipart/form-data
  ```

- [ ] 14. Test customer view
  ```bash
  GET /api/itinerary/my-bookings/1/itinerary
  Authorization: Bearer {customer_token}
  ```

### Permission Testing

- [ ] 15. Verify seller can only manage own tours
- [ ] 16. Verify guide can only check-in assigned tours
- [ ] 17. Verify customer can only view own bookings
- [ ] 18. Verify admin has full access

### Data Flow Testing

- [ ] 19. Create complete workflow:

  - Create template
  - Create booking
  - Initialize itinerary
  - Assign tour guide
  - Perform check-ins
  - Upload photos
  - Verify customer sees updates

- [ ] 20. Test progress auto-update
  - Check-in at checkpoint
  - Verify progress_percentage updates
  - Verify status changes (not_started → in_progress → completed)

### Error Handling

- [ ] 21. Test with invalid booking_id
- [ ] 22. Test with unauthorized user
- [ ] 23. Test with missing required fields
- [ ] 24. Test with invalid file upload
- [ ] 25. Test with non-existent template

## 🚀 Post-Deployment Checklist

### Monitoring

- [ ] 26. Monitor API response times
- [ ] 27. Check database query performance
- [ ] 28. Monitor upload folder size
- [ ] 29. Check error logs

### Documentation

- [ ] 30. Share `TOUR_ITINERARY_README.md` with team
- [ ] 31. Train sellers on template creation
- [ ] 32. Train tour guides on check-in process
- [ ] 33. Prepare customer tutorial

### Performance

- [ ] 34. Test with multiple concurrent check-ins
- [ ] 35. Test with large photo uploads
- [ ] 36. Verify index usage with EXPLAIN
- [ ] 37. Monitor trigger execution time

### Security

- [ ] 38. Verify JWT token validation
- [ ] 39. Test file upload restrictions
- [ ] 40. Check SQL injection protection
- [ ] 41. Verify CORS settings

## 📊 Success Metrics

### Technical Metrics

- [ ] API response time < 500ms
- [ ] Photo upload success rate > 95%
- [ ] Database triggers execute < 100ms
- [ ] Zero SQL errors in logs

### Business Metrics

- [ ] Sellers create templates for all tours
- [ ] Tour guides check-in at > 80% of checkpoints
- [ ] Customers view progress regularly
- [ ] Photo upload average 2-3 per checkpoint

## 🐛 Known Issues & Workarounds

### Issue 1: Large photo files

**Solution:** Implement client-side image compression

### Issue 2: GPS accuracy

**Solution:** Accept check-ins within 100m radius

### Issue 3: Offline check-ins

**Future:** Implement offline mode with sync

## 📞 Support Contacts

### Technical Issues

- Backend: Check `backend/main.py` logs
- Database: Check MySQL error logs
- Upload: Check `uploads/checkpoint_photos/` permissions

### Business Questions

- See `TOUR_ITINERARY_SYSTEM.md`
- See `TOUR_ASSIGNMENT_SYSTEM.md`

## 🔄 Rollback Plan

If issues occur:

1. **Stop backend**

   ```bash
   # Stop running backend server
   ```

2. **Restore database**

   ```bash
   mysql -u root -p viego_blog < backup_before_itinerary.sql
   ```

3. **Revert code changes**
   ```bash
   # Remove new files if needed
   # Revert main.py changes
   ```

## ✨ Quick Start for New Users

### Seller Quick Start

1. Login as seller
2. Go to Tours → Select Tour → Create Itinerary Template
3. Add days and checkpoints
4. Save template
5. When booking comes, click "Initialize Itinerary"
6. Assign tour guide

### Tour Guide Quick Start

1. Login as tour guide
2. Go to My Assignments
3. View tour details and itinerary
4. On tour day, click "Check-in" at each checkpoint
5. Upload photos
6. Add notes

### Customer Quick Start

1. Login and go to My Bookings
2. Click on active booking
3. View "Tour Progress"
4. See real-time updates and photos

## 📝 Final Checks

- [ ] All database tables created ✅
- [ ] All models import successfully ✅
- [ ] All routes registered ✅
- [ ] All API endpoints tested ✅
- [ ] Documentation complete ✅
- [ ] Setup script works ✅
- [ ] Permissions configured ✅
- [ ] Upload folder ready ✅

## 🎉 Deployment Complete!

Date: ********\_********
Deployed by: ********\_********
Verified by: ********\_********

**Status: READY FOR PRODUCTION** ✅

---

## Next Steps After Deployment

1. **Week 1**: Monitor closely, fix any bugs
2. **Week 2**: Gather user feedback
3. **Week 3**: Optimize based on usage patterns
4. **Week 4**: Plan frontend enhancements

## Future Enhancements

- [ ] Real-time notifications via Socket.IO
- [ ] Mobile app integration
- [ ] Offline mode for tour guides
- [ ] AI-powered route optimization
- [ ] Weather API integration
- [ ] Multilingual support
- [ ] Video check-ins
- [ ] QR code scanning
