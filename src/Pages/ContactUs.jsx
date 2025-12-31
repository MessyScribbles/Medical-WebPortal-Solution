import React, { useState } from 'react';
import HomeNavbar from '../components/HomeNavbar';
import { FaPaperPlane, FaExclamationCircle } from 'react-icons/fa';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    object: '',
    email: '',
    message: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.object || !formData.email || !formData.message) {
      setError('All fields are required. Please fill them out.');
      return;
    }
    setSuccess(true);
    console.log("Message Sent:", formData);
  };

  const inputStyle = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#000080] focus:border-transparent outline-none transition bg-gray-50";

  return (
    // Flex column layout to push footer to bottom
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col justify-between">
      <HomeNavbar />

      <div className="py-12 px-4 sm:px-6 lg:px-8 flex flex-grow justify-center items-center">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#000080]">Contact Us</h2>
            <p className="text-gray-600 mt-2">We'd love to hear from you.</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-sm">
                  <FaExclamationCircle className="mr-2" /> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Object of Contact</label>
                <select name="object" value={formData.object} onChange={handleChange} className={inputStyle}>
                  <option value="">Select a topic...</option>
                  <option value="question">General Question</option>
                  <option value="sponsorship">Sponsorship</option>
                  <option value="support">Technical Support</option>
                  <option value="career">Careers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} placeholder="name@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea name="message" rows={4} value={formData.message} onChange={handleChange} className={inputStyle} placeholder="How can we help?"></textarea>
              </div>

              <button type="submit" className="w-full bg-[#000080] hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2">
                <FaPaperPlane /> Send Message
              </button>
            </form>
          ) : (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPaperPlane className="text-green-600 text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Gone!</h3>
              <p className="text-gray-600 mt-2">Your message has been sent successfully.</p>
              <button onClick={() => { setSuccess(false); setFormData({object:'', email:'', message:''}); }} className="mt-6 text-[#000080] font-semibold hover:underline">
                Send another message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Added */}
      <footer className="bg-white py-8 text-center border-t border-gray-200">
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

export default ContactUs;