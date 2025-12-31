import React from 'react';
import { Link } from 'react-router-dom';
import HomeNavbar from '../components/HomeNavbar';
import { FaUserMd, FaDatabase, FaIdCard, FaQuestionCircle, FaArrowRight } from 'react-icons/fa';

const HowToConnect = () => {
  const steps = [
    {
      id: 1,
      title: "Find a Partner Doctor",
      desc: "Go to a doctor or clinic that uses the MediPortal platform. They will be the primary point of contact for your initial setup.",
      icon: <FaUserMd className="text-4xl text-white" />,
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "Data Collection",
      desc: "Let the medical staff gather your necessary health data. They will input your medical history into our secure system.",
      icon: <FaDatabase className="text-4xl text-white" />,
      color: "bg-indigo-500"
    },
    {
      id: 3,
      title: "Registration & Credentials",
      desc: "Once they add you to the system, they will generate your unique login credentials. You will receive a secure ID and Password.",
      icon: <FaIdCard className="text-4xl text-white" />,
      color: "bg-purple-500"
    },
    {
      id: 4,
      title: "Keep Them Safe!",
      desc: "Do not lose these credentials. You will need them to log in to the portal, view your history, and book future tele-consultations.",
      icon: <FaQuestionCircle className="text-4xl text-white" />,
      color: "bg-red-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <HomeNavbar />

      {/* Header Section */}
      {/* UPDATED: Background darkened to #cfe2ff for a distinct blue-ish look */}
      <div className="bg-[#cfe2ff] text-[#000080] py-20 px-4 text-center border-b border-gray-200">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">How to Connect</h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto font-medium">
          Joining MediPortal is secure and doctor-verified. Follow these simple steps to get started.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow">
        
        {/* Intro Image/Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
                <img 
                    src="https://i.postimg.cc/SsyFR6b4/How-To-Page.jpg" 
                    alt="Doctor Tablet" 
                    className="rounded-2xl shadow-2xl border-4 border-white"
                />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Why In-Person First?</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    To ensure the highest security and accuracy of your medical records, we require an initial in-person verification. This prevents identity fraud and ensures your medical history is accurately recorded by a professional before you begin using telemedicine.
                </p>
                <div className="bg-blue-50 border-l-4 border-[#000080] p-4">
                    <p className="text-[#000080] font-semibold">
                        Your health data is sensitive. We treat it with the care it deserves.
                    </p>
                </div>
            </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden group">
              <div className={`${step.color} p-6 flex justify-center items-center h-32`}>
                {step.icon}
              </div>
              <div className="p-8">
                <div className="flex items-center mb-4">
                   <span className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                    {step.id}
                   </span>
                   <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Us CTA */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-bold text-[#000080] mb-4">Any more questions?</h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
                    If you are having trouble finding a partner doctor or lost your credentials, our support team is here to help you get back on track.
                </p>
                <Link 
                    to="/contact" 
                    className="inline-flex items-center px-8 py-4 bg-[#000080] hover:bg-blue-900 text-white font-bold rounded-lg transition text-lg shadow-lg"
                >
                    Contact Support <FaArrowRight className="ml-2" />
                </Link>
            </div>
            {/* Decorative background circle */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-50 rounded-full opacity-50 z-0"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-50 rounded-full opacity-50 z-0"></div>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white py-10 text-center border-t border-gray-200">
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

export default HowToConnect;