import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "../assets/logo/jubjub-logo.svg";

const LAST_UPDATED = "27 November 2026";

// Shared layout for the Terms and Privacy pages
const LegalPage = ({ title, intro, sections }) => (
  // w-screen: body is a flex container, so w-full would shrink to the content.
  // This div is the scroller, like the other full-screen pages.
  <div className="h-dvh w-screen app-bg text-gray-900 overflow-y-auto">
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to JubJub
        </Link>
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="w-[34px] h-[34px] rounded-[8px]" />
          <span className="font-extrabold tracking-tight">JubJub</span>
        </div>
      </div>

      {/* select-text: the app turns off text selection, but people may want to copy this */}
      <article className="surface rounded-3xl p-6 sm:p-10 select-text">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-xs text-gray-500">Last updated {LAST_UPDATED}</p>
        <p className="mt-5 text-sm leading-relaxed text-gray-700">{intro}</p>

        {sections.map(({ heading, body }) => (
          <section key={heading} className="mt-7">
            <h2 className="text-lg font-bold tracking-tight">{heading}</h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-gray-700">
              {body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  </div>
);

export const Terms = () => (
  <LegalPage
    title="Terms of Use"
    intro="JubJub is a chat app for talking with friends in a shared public room and in private chats. These are the rules for using it."
    sections={[
      {
        heading: "Your account",
        body: [
          "Give a real name and an email address you can access. Keep your password to yourself: you're responsible for what happens on your account.",
          "You must be at least 13 years old to use JubJub.",
        ],
      },
      {
        heading: "What you post",
        body: [
          "You own the messages and photos you send. You let JubJub store them and show them to the people in that chat, which is what's needed to run the app.",
          "Messages in the Public Room can be read by every JubJub user, including people who join later.",
        ],
      },
      {
        heading: "Be decent",
        body: [
          "Don't harass, threaten or impersonate anyone, and don't post anything illegal, hateful, sexually explicit, or that you don't have the right to share.",
          "Don't spam, try to break into other accounts, or attack the service.",
          "Accounts that break these rules may be suspended or removed, and their content deleted.",
        ],
      },
      {
        heading: "The service",
        body: [
          'JubJub is provided "as is". It may change, have downtime, or lose data, so don\'t rely on it as the only copy of anything important.',
          "These terms may be updated. If they change in a meaningful way, the date at the top will change too.",
        ],
      },
    ]}
  />
);

export const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    intro="This page explains what JubJub stores about you, why, and who can see it."
    sections={[
      {
        heading: "What we store",
        body: [
          "Account: your name, email address and a scrambled (hashed) version of your password. We never store your actual password.",
          "Activity: the messages and photos you send, who your friends are, which chats you've read or muted, whether you're online, and when you were last seen.",
        ],
      },
      {
        heading: "Who can see it",
        body: [
          "Other users can see your name, email, online status and last-seen time in the People list.",
          "Public Room messages are visible to every user. Private chat messages are visible only to the two people in that chat.",
          "Photos are stored with Cloudinary, our image hosting provider. If you use Forgot password, the reset email is sent through our email provider.",
          "We don't sell your data or use it for advertising.",
        ],
      },
      {
        heading: "On your device",
        body: [
          'JubJub keeps your login in your browser\'s storage. With "Remember me" ticked it stays until you log out or it expires; otherwise it\'s cleared when you close the browser.',
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can change your name and password in Settings at any time.",
          "To have your account and messages deleted, contact the app's owner.",
        ],
      },
    ]}
  />
);
