const keylessRedirectUri = `${window.location.origin}/login/callback`;
const googleKeylessClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
console.log("THISSSS", googleKeylessClientId);
const getKeylessUri = (nonce: string) => {
  return `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&scope=openid+email+profile&nonce=${nonce}&redirect_uri=${keylessRedirectUri}&client_id=${googleKeylessClientId}`;
};

export const KeylessConfig = {
  getKeylessUri,
};
