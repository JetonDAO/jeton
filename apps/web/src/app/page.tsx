import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <header>
        <nav className="flex justify-between items-center p-5 bg-opacity-40 border border-white bg-[#b87d5b] text-white m-5 rounded-2xl">
          <div className="text-2xl font-bold">Jeton</div>
          <ul className="flex space-x-8">
            <li>
              <a href="#about" className="hover:text-gray-400">
                About
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-gray-400">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="hover:text-gray-400">
                How It Works
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-gray-400">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="flex-grow text-center py-20 text-white max-w-5xl mx-auto">
        {/* <Image
          width={80}
          height={80}
          className="w-40 aspect-square"
          src="/images/logo.png"
          alt="Logo"
        /> */}
        <h1 className="text-5xl font-bold mb-6 leading-[4rem]">Jeton: Decentralized Poker Game</h1>
        <p className="text-xl mb-10 leading-9">
          Experience the thrill of a decentralized poker game, where fairness is guaranteed. Cards
          are shuffled securely by players, ensuring transparency and security in every hand.
        </p>
        <a
          href="/games"
          className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-lg text-xl"
        >
          Play Now
        </a>
      </main>

      <footer className="p-5 bg-[#b87d5b] bg-opacity-40 m-5 rounded-2xl text-white py-8">
        <div className="container mx-auto text-center">
          <div className="mb-4">
            <a
              href="https://facebook.com"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-facebook-f" /> Facebook
            </a>
            <a
              href="https://twitter.com"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-twitter" /> Twitter
            </a>
            <a
              href="https://instagram.com"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-instagram" /> Instagram
            </a>
            <a
              href="https://linkedin.com"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-linkedin" /> LinkedIn
            </a>
          </div>
          <p className="text-white">© 2024 Jeton. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
