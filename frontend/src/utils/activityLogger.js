// Utility function to log user activities
export const logActivity = async (activityData) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.email) return;

    const response = await fetch('http://localhost:5000/api/log-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        ...activityData
      })
    });

    const result = await response.json();
    if (result.status === 'success') {
      console.log('✅ Activity logged:', activityData.action);
    } else {
      console.error('❌ Failed to log activity:', result.message);
    }
  } catch (error) {
    console.error('❌ Error logging activity:', error);
  }
};

// Predefined activity types for consistency
export const ActivityTypes = {
  POST: 'post',
  BID: 'bid',
  PROFILE: 'profile',
  PAYMENT: 'payment',
  NOTIFICATION: 'notification',
  EDIT: 'edit',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout'
};

// Predefined actions for consistency
export const ActivityActions = {
  POSTED_ITEM: 'posted item',
  EDITED_ITEM: 'edited item',
  DELETED_ITEM: 'deleted item',
  PLACED_BID: 'placed bid',
  WON_AUCTION: 'won auction',
  LOST_AUCTION: 'lost auction',
  UPDATED_PROFILE: 'updated profile',
  ADDED_PROFILE_PICTURE: 'added profile picture',
  DELETED_PROFILE_PICTURE: 'deleted profile picture',
  COMPLETED_PAYMENT: 'completed payment',
  PENDING_PAYMENT: 'pending payment',
  RECEIVED_NOTIFICATION: 'received notification',
  LOGGED_IN: 'logged in',
  LOGGED_OUT: 'logged out'
};

// Helper functions for common activities
export const logPostActivity = (itemTitle, amount, category) => {
  return logActivity({
    type: ActivityTypes.POST,
    action: ActivityActions.POSTED_ITEM,
    item: itemTitle,
    amount: amount,
    category: category,
    status: 'active'
  });
};

export const logEditActivity = (itemTitle, category) => {
  return logActivity({
    type: ActivityTypes.EDIT,
    action: ActivityActions.EDITED_ITEM,
    item: itemTitle,
    amount: 0,
    category: category,
    status: 'completed'
  });
};

export const logDeleteActivity = (itemTitle, category) => {
  return logActivity({
    type: ActivityTypes.DELETE,
    action: ActivityActions.DELETED_ITEM,
    item: itemTitle,
    amount: 0,
    category: category,
    status: 'completed'
  });
};

export const logBidActivity = (itemTitle, amount, category, status = 'active') => {
  return logActivity({
    type: ActivityTypes.BID,
    action: ActivityActions.PLACED_BID,
    item: itemTitle,
    amount: amount,
    category: category,
    status: status
  });
};

export const logProfileActivity = (action, item) => {
  return logActivity({
    type: ActivityTypes.PROFILE,
    action: action,
    item: item,
    amount: 0,
    category: 'Profile',
    status: 'completed'
  });
};

export const logPaymentActivity = (itemTitle, amount, status) => {
  return logActivity({
    type: ActivityTypes.PAYMENT,
    action: status === 'Completed' ? ActivityActions.COMPLETED_PAYMENT : ActivityActions.PENDING_PAYMENT,
    item: itemTitle,
    amount: amount,
    category: 'Payment',
    status: status
  });
};

export const logNotificationActivity = (message) => {
  return logActivity({
    type: ActivityTypes.NOTIFICATION,
    action: ActivityActions.RECEIVED_NOTIFICATION,
    item: message,
    amount: 0,
    category: 'Notification',
    status: 'unread'
  });
}; 