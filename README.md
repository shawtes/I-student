I-Student

A student workspace app built with React and Node.js/Express. Lets students manage files, get AI tutoring help, generate study materials, schedule sessions, and find study partners.

 Team
Group 10 - The Nerds (Spring 2026)
- Khoa Nguyen, Alvin Momoh, Tiya Tulu, Sineshaw Tesfaye, Preston Paris

 Setup

1. Clone and install dependencies

```bash
git clone https://github.com/shawtes/I-student.git
cd I-student
npm install
cd client && npm install && cd ..
```

2. Set up AWS Amplify (first time only)

You need Node.js, an AWS account, and the Amplify CLI.

```bash
install amplify cli
npm install -g @aws-amplify/cli

configure it with your AWS credentials (follow the prompts)
amplify configure
```

Then pull the existing Amplify backend so you get the Cognito setup:

```bash
cd client
amplify pull --appId d1s63qj9hsr1zj --envName dev
```

It'll ask you some questions — use these answers:
- Default editor: **Visual Studio Code**
- App type: **javascript**
- Framework: **react**
- Source dir: **src**
- Distribution dir: **build**
- Build command: **npm run build**
- Start command: **npm start**

This generates `src/aws-exports.js` which the app needs to connect to Cognito.

3. Set up environment variables

```bash
cd ..
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGODB_URI` — your MongoDB connection string
- `OPENAI_API_KEY` — your OpenAI key
- `COGNITO_REGION` and `COGNITO_USER_POOL_ID` are already set to our pool

4. Run the app

```bash
terminal 1 - backend
npm run dev

terminal 2 - frontend
npm run client
```

Backend runs on http://localhost:5000, frontend on http://localhost:3000.

5. If you need to modify the Cognito setup

```bash
cd client

see what's deployed
amplify status

change auth settings
amplify update auth

push changes to AWS
amplify push
```

 How auth works

- Users sign up with email + password on the frontend
- Cognito sends a verification code to their email
- After entering the code, they're verified and logged in
- The frontend gets a JWT token from Cognito and sends it with every API request
- The backend verifies that token against Cognito's public keys
- On first login, a user record is created in MongoDB

 License

MIT
