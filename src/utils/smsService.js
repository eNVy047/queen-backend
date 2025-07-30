import twilio from "twilio";

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  
  

  async sendOTP(phoneNumber, code) {
    try {
      const message = await this.client.messages.create({
        body: `Your ${process.env.APP_NAME} verification code is: ${code}. This code will expire in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('SMS verification code sent:', message.sid);
      return true;
    } catch (error) {
      console.error('Error sending SMS verification code:', error);
      return false;
    }
  }

  async sendWelcomeMessage(phoneNumber, firstName) {
    try {
      const message = await this.client.messages.create({
        body: `Welcome to ${process.env.APP_NAME}, ${firstName}! Your account has been successfully created. Start exploring and find your perfect match!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('Welcome SMS sent:', message.sid);
      return true;
    } catch (error) {
      console.error('Error sending welcome SMS:', error);
      return false;
    }
  }

  // generateVerificationCode() {
  //   return Math.floor(100000 + Math.random() * 900000).toString();
  // }
}


const smsService = new SMSService();
export default smsService;