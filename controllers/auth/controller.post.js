const jwt = require('jsonwebtoken');
const { User } = require('../../models');

function generateEmailToken() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

const EMAIL_TOKEN_EXPIRATION_MINUTES = 100000;

module.exports = {
  login: async (req, res, next) => {
    try {
      // const { email } = req.body;
      // const user = await this.prisma.user.findUnique({
      //   where: { email: email },
      // });

      // if (!user) {
      //   console.log('no user with that email was found');
      //   throw new Error('no user with that email was found');
      // }

      const emailToken = generateEmailToken();
      const now = new Date();
      const tokenExpiration = new Date(
        now.getTime() + EMAIL_TOKEN_EXPIRATION_MINUTES
      );

      // const createdToken = await this.prisma.token.create({
      //   data: {
      //     emailToken,
      //     type: 'EMAIL',
      //     expirationDate: tokenExpiration,
      //     // userId: user.id,
      //     expiration: 10,
      //   },
      // });
      const createdToken = {
        emailToken,
        type: 'EMAIL',
        expirationDate: tokenExpiration,
        // userId: user.id,
        expiration: 10,
        name: 'user',
      };

      // console.log(createdToken);
      // const createdToken = await this.prisma.token.create({
      //   data: {
      //     emailToken,
      //     type: TokenType.EMAIL,
      //     expirationDate: tokenExpiration,
      //     userId: user.id,
      //     expiration: 10,
      //   },
      // });

      // TODO
      // const token = jwt.sign({ user });

      res.status(200).json({ ...createdToken });

      // const userData = await User.findOne({
      //   where: {
      //     email: req.body.email,
      //   },
      // });

      // if (!userData) {
      //   const error = new Error('Incorrect username');
      //   error.status = 500;
      //   throw error;
      // }

      // const passwordData = await userData.checkPassword(
      //   req.body.password,
      //   userData.password
      // );

      // if (!passwordData) {
      //   const error = new Error('Incorrect password');
      //   error.status = 500;
      //   throw error;
      // }

      // const tokenData = {
      //   id: userData.id,
      //   first_name: userData.first_name,
      //   last_name: userData.last_name,
      //   email: userData.email,
      //   subscription_active: userData.subscription_active,
      //   // subscription_id: userData.subscription_id,
      //   // stripe_id: userData.stripe_id,
      //   is_admin: userData.is_admin,
      // };

      // const token = jwt.sign(tokenData, 'YOUR_SECRET_KEY', {
      //   expiresIn: '24h',
      // });

      // // res.cookie('roop-verma-library', token);

      // res.status(200).json({
      //   userData,
      //   token,
      // });
    } catch (err) {
      next(err);
    }
  },

  logout: async (_req, res) => {
    return res
      .clearCookie('access_token')
      .status(200)
      .json({ message: 'Successfully logged out' });
  },
};
