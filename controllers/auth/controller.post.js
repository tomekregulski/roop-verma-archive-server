module.exports = {
  logout: async (_req, res) => {
    // is this actualy doing anything?
    return res
      .clearCookie('access_token')
      .status(200)
      .json({ message: 'Successfully logged out' });
  },
};
