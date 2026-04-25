const baseUrl = '/api/password-reset';

// Step 1: Ask for the OTP
const requestOtp = async (email) => {
  const response = await fetch(`${baseUrl}/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Failed to request OTP');
  }

  return response.json();
};

// Step 2: Send the OTP, get the Reset Token back
const verifyOtp = async (email, otp) => {
  const response = await fetch(`${baseUrl}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  });

  if (!response.ok) {
    throw new Error('Failed to verify OTP');
  }

  return response.json();
};

// Step 3: Send the new password with the Token and Email
const resetPassword = async (email, resetToken, newPassword) => {
    const response = await fetch(`${baseUrl}/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, resetToken, newPassword }),
  });

  if (!response.ok) {
    throw new Error('Failed to reset password');
  }

  return response.json();
};

export default { requestOtp, verifyOtp, resetPassword };