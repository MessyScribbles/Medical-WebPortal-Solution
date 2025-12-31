import React from 'react';
import Slider from "react-slick";
import { Link } from 'react-router-dom'; // Import Link for navigation
import HomeNavbar from '../components/HomeNavbar';
import { FaChartLine, FaUserFriends, FaMapMarkerAlt, FaQuoteLeft, FaUniversity } from 'react-icons/fa';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const LandingPage = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 1000, 
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000, 
    fade: true, 
    pauseOnHover: false,
    arrows: false,
  };

  const slides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
      title: "Bridging the Distance",
      text: "Connecting the furthest douar to the best specialists in the Kingdom."
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
      title: "Healthcare for Everyone",
      text: "Technology that serves humanity, built by Moroccan students."
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
      title: "Secure & Trusted",
      text: "Your health data is encrypted and protected by state-of-the-art security."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <HomeNavbar />

      {/* --- HERO SLIDESHOW --- */}
      <div className="relative bg-gray-900 h-[75vh]">
        <Slider {...settings} className="h-full">
          {slides.map((slide) => (
            <div key={slide.id} className="relative h-[75vh] outline-none">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${slide.image}')` }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              </div>
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center max-w-5xl mx-auto px-6 text-white">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-2xl tracking-tight">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-3xl font-light max-w-4xl drop-shadow-lg leading-relaxed mb-8">
                  {slide.text}
                </p>
                
                {/* UPDATED: Changed from <a> to <Link> and pointing to new page */}
                <Link 
                  to="/how-to-connect" 
                  className="px-8 py-3 bg-[#000080] hover:bg-blue-900 text-white font-bold rounded-full transition duration-300 shadow-lg text-lg border-2 border-transparent hover:border-white"
                >
                  Learn How to connect with doctors
                </Link>

              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* --- SECTION 1: STATISTICS --- */}
      <div className="bg-gray-50 py-20 border-b border-gray-200 relative z-20 -mt-10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Our Impact by the Numbers</h2>
            <p className="text-gray-500 mt-2">Real results from pilot programs across the region.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#000080] hover:-translate-y-2 transition duration-300">
              <FaMapMarkerAlt className="text-5xl mb-6 text-[#000080]" />
              <h3 className="text-5xl font-extrabold text-gray-900 mb-2">1st</h3>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4">Telemedicine Platform</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                We are the first student-led initiative to successfully navigate the complex regulatory landscape of Moroccan digital health.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#000080] hover:-translate-y-2 transition duration-300">
              <FaUserFriends className="text-5xl mb-6 text-[#000080]" />
              <h3 className="text-5xl font-extrabold text-gray-900 mb-2">15k+</h3>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4">Registered Users</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                From tech-savvy youth in Casablanca to elders in remote Atlas villages, our intuitive design ensures quality healthcare for all.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#000080] hover:-translate-y-2 transition duration-300">
              <FaChartLine className="text-5xl mb-6 text-[#000080]" />
              <h3 className="text-5xl font-extrabold text-gray-900 mb-2">85%</h3>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4">Higher Efficiency</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                By filtering non-emergency cases through video triage, we free up critical hospital resources for those who need them most.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: TEXT CONTENT --- */}
      <div className="bg-white py-24"> 
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#000080] mb-6">
              Why We Built MediPortal
            </h2>
            <div className="w-24 h-1 bg-[#000080] mx-auto mb-8"></div>
          </div>

          <div className="prose prose-lg mx-auto text-gray-600 leading-loose text-justify">
            <p className="mb-8 first-letter:text-5xl first-letter:font-bold first-letter:text-[#000080] first-letter:mr-3 first-letter:float-left">
              The reality of healthcare accessibility in our country is stark. According to recent data from the World Health Organization (W.H.O.), Morocco faces a critical shortage of medical professionals, averaging approximately <span className="font-bold text-red-500">1 doctor for every 1,000 citizens</span>. This ratio falls significantly below the recommended global standard, creating a massive strain on public hospitals.
            </p>
            
            <p className="mb-8">
              Beyond the raw statistics, the true challenge is <span className="font-bold text-[#000080]">communication and distance</span>. Patients often travel hundreds of kilometers over difficult terrain only to find clinics fully booked. The existing system is overwhelmed, and the distance between patient and healer has never felt wider.
            </p>

            <div className="bg-blue-50 p-10 rounded-xl border-l-4 border-[#000080] my-12 shadow-sm">
              <FaQuoteLeft className="text-[#000080] text-3xl mb-4" />
              <p className="italic text-gray-800 font-medium text-lg leading-relaxed">
                "We didn't build this because it was a school project. We built it because we saw our own families waiting weeks for appointments that could have been resolved in minutes. We are a group of engineering students from the <span className="font-bold text-[#000080]">International University of Casablanca (UIC)</span> who believe technology must serve humanity."
              </p>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mt-10 mb-4">Our Vision for the Future</h3>
            <p className="mb-16">
              MediPortal was born from this observation. We are building a future where AI-assisted triage helps doctors prioritize critical cases, and where geography no longer dictates the quality of care a citizen receives. We are not just an app; we are a digital bridge connecting the furthest douar to the best specialists in the Kingdom.
            </p>

            <div className="mt-20 pt-10 border-t-2 border-gray-100 text-center">
              <FaUniversity className="text-4xl text-[#000080] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Acknowledgements</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                We extend our deepest gratitude to the <span className="font-bold text-[#000080]">International University of Casablanca (UIC)</span> and our esteemed professors. Their unwavering support, technical mentorship, and belief in our vision turned a simple classroom idea into a solution that has the power to change lives.
              </p>
              <p className="text-gray-500 mt-4 font-medium">This project is a reality because of you.</p>
            </div>

          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-transparent py-10 text-center border-t border-gray-100">
        <p className="text-gray-500 text-sm font-medium">
          © {new Date().getFullYear()} MediPortal Morocco. All Trademarks Registered.
        </p>
        <p className="text-gray-400 text-xs mt-2">
          Made with care by student developers from UIC.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;