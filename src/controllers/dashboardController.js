import BookModel from '../models/Book.js';
import BorrowingModel from '../models/Borrowing.js';
import CategoryModel from '../models/Category.js';
import RatingModel from '../models/Rating.js';
import UserModel from '../models/User.js';

class DashboardController {
  // Get admin dashboard data
  static async getAdminDashboard(req, res) {
    try {
      // Get total books
      const totalBooksResult = await BookModel.getTotalBooks();
      if (!totalBooksResult.success) {
        return res.status(500).json({ error: totalBooksResult.error });
      }

      // Get active borrowings
      const activeBorrowingsResult = await BorrowingModel.getActiveBorrowings();
      if (!activeBorrowingsResult.success) {
        return res.status(500).json({ error: activeBorrowingsResult.error });
      }

      // Get pending requests
      const pendingRequestsResult = await BorrowingModel.getPendingRequests();
      if (!pendingRequestsResult.success) {
        return res.status(500).json({ error: pendingRequestsResult.error });
      }

      // Get recent activities
      const recentActivitiesResult = await BorrowingModel.getRecentActivities();
      if (!recentActivitiesResult.success) {
        return res.status(500).json({ error: recentActivitiesResult.error });
      }

      // Get system overview data
      const overdueBooksResult = await BorrowingModel.getOverdueBooksCount();
      if (!overdueBooksResult.success) {
        return res.status(500).json({ error: overdueBooksResult.error });
      }

      const dueTodayResult = await BorrowingModel.getDueTodayCount();
      if (!dueTodayResult.success) {
        return res.status(500).json({ error: dueTodayResult.error });
      }

      const newUsersResult = await UserModel.getNewUsersThisWeekCount();
      if (!newUsersResult.success) {
        return res.status(500).json({ error: newUsersResult.error });
      }

      // Format stats data
      const stats = [
        {
          icon: 'FaBook',
          number: totalBooksResult.data.toString(),
          label: 'Total Books',
          description: 'Books in library',
          link: '#',
          linkText: 'Manage'
        },
        {
          icon: 'FaBookOpen',
          number: activeBorrowingsResult.data.toString(),
          label: 'Active Borrows',
          description: 'Currently borrowed books',
          link: '#',
          linkText: 'View all'
        },
        {
          icon: 'FaClock',
          number: pendingRequestsResult.data.toString(),
          label: 'Pending Requests',
          description: 'Awaiting approval',
          link: '#',
          linkText: 'View all'
        }
      ];

      // Format recent activities
      const recentActivities = recentActivitiesResult.data.map(activity => {
        let action = 'borrowed';
        let status = activity.status.toLowerCase();
        
        if (activity.return_date) {
          action = 'returned';
          status = 'returned';
        } else if (activity.status === 'Pending') {
          action = 'requested';
          status = 'pending';
        }

        // Calculate time difference for display
        const activityDate = activity.return_date || activity.borrow_date;
        const now = new Date();
        const diffTime = Math.abs(now - new Date(activityDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let timeAgo;
        if (diffDays === 1) {
          timeAgo = '1 day ago';
        } else if (diffDays < 7) {
          timeAgo = `${diffDays} days ago`;
        } else {
          timeAgo = new Date(activityDate).toLocaleDateString();
        }

        return {
          user: activity.user_name,
          book: activity.book_title,
          action: action,
          date: timeAgo,
          status: status
        };
      });

      // Get activity trends for line chart (last 7 days)
      const activityTrendsResult = await BorrowingModel.getActivityTrends();
      if (!activityTrendsResult.success) {
        return res.status(500).json({ error: activityTrendsResult.error });
      }

      // Get system overview chart data
      const systemOverviewChartResult = await BorrowingModel.getSystemOverviewChart();
      if (!systemOverviewChartResult.success) {
        return res.status(500).json({ error: systemOverviewChartResult.error });
      }

      // Format system overview data
      const systemOverview = {
        overdueBooksCount: overdueBooksResult.data,
        dueTodayCount: dueTodayResult.data,
        newUsersThisWeekCount: newUsersResult.data,
        chartData: systemOverviewChartResult.data
      };

      res.json({
        success: true,
        data: {
          stats: stats,
          recentActivities: recentActivities,
          activityTrends: activityTrendsResult.data,
          systemOverview: systemOverview
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get users dashboard data
  static async getUserDashboard(req, res) {
    try {
      const userId = req.params.userId;

      // Get users active borrowings
      const activeBorrowingsResult = await BorrowingModel.getUserActiveBorrowings(userId);
      if (!activeBorrowingsResult.success) {
        return res.status(500).json({ error: activeBorrowingsResult.error });
      }

      // Get users pending requests
      const pendingRequestsResult = await BorrowingModel.getUserPendingRequests(userId);
      if (!pendingRequestsResult.success) {
        return res.status(500).json({ error: pendingRequestsResult.error });
      }

      // Get users borrowing history
      const borrowingHistoryResult = await BorrowingModel.getUserBorrowingHistory(userId);
      if (!borrowingHistoryResult.success) {
        return res.status(500).json({ error: borrowingHistoryResult.error });
      }

      // Get book recommendations
      const recommendationsResult = await RatingModel.getBookRecommendations(3);
      if (!recommendationsResult.success) {
        return res.status(500).json({ error: recommendationsResult.error });
      }

      // Format stats data
      const stats = [
        {
          icon: 'FaBookOpen',
          number: activeBorrowingsResult.data.length.toString(),
          label: 'My Active Borrows',
          description: 'Books currently borrowed',
          link: '#',
          linkText: 'View all'
        },
        {
          icon: 'FaClock',
          number: pendingRequestsResult.data.length.toString(),
          label: 'Pending Requests',
          description: 'Awaiting approval',
          link: '#',
          linkText: 'Check status'
        }
      ];

      // Format borrowing history for myBorrows section
      const myBorrows = borrowingHistoryResult.data.slice(0, 3).map(borrow => {
        let status = borrow.status.toLowerCase();
        if (borrow.return_date) {
          status = 'returned';
        }

        // Get progress
        let progress = borrow.progress_percentage || 0;
        if (status === 'returned' && progress === 0) {
          progress = 100;
        }

        return {
          title: borrow.title,
          author: borrow.author,
          status: status,
          borrowDate: borrow.borrow_date ? new Date(borrow.borrow_date).toISOString().split('T')[0] : null,
          dueDate: borrow.due_date ? new Date(borrow.due_date).toISOString().split('T')[0] : null,
          progress: progress
        };
      });

      // Format recommendations
      const recommendations = recommendationsResult.data.map(book => ({
        title: book.title,
        author: book.author,
        rating: parseFloat(book.avg_rating).toFixed(1)
      }));

      res.json({
        success: true,
        data: {
          stats: stats,
          myBorrows: myBorrows,
          recommendations: recommendations
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default DashboardController;