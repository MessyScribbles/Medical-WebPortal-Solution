import React, { useState } from 'react';
import { db } from '../firebase'; // Adjust path if needed
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import HomeNavbar from '../components/HomeNavbar';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const DoctorRegister = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // State to hold form data (No password needed)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    license: '',
    cid: '',
    hospital: '',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Save to "doctor_applications" collection
      await addDoc(collection(db, "doctor_applications"), { 
        ...formData,
        status: "pending",
        submittedAt: serverTimestamp()
      });

      // 2. Success!
      setIsSubmitted(true);
      window.scrollTo(0, 0); 
    } catch (err) {
      console.error("Error adding document: ", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#000080] focus:border-transparent outline-none transition bg-gray-50";

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <HomeNavbar />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
          
          {!isSubmitted ? (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-[#000080]">Doctor Registration</h2>
                <p className="text-gray-600 mt-2">Join our network of telemedicine professionals.</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center">
                  <FaExclamationCircle className="mr-2" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className={inputStyle} placeholder="Dr. Jane Doe" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} placeholder="doctor@example.com" />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputStyle} placeholder="+212 ..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical ID / License # *</label>
                  <input type="text" name="license" value={formData.license} onChange={handleChange} required className={inputStyle} placeholder="MED-123456" />
                 </div>

                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CID (National ID) *</label>
                  <input type="text" name="cid" value={formData.cid} onChange={handleChange} required className={inputStyle} placeholder="ID Number" />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Hospital of Practice *</label>
                   <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} required className={inputStyle} placeholder="City General Hospital" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Address *</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} required rows={3} className={inputStyle} placeholder="Street, City, Zip Code"></textarea>
                </div>

                <div className="md:col-span-2 mt-4">
                  <button type="submit" disabled={loading} className={`w-full bg-[#000080] hover:bg-blue-900 text-white font-bold py-4 rounded-lg transition duration-200 text-lg shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-12">
              <FaCheckCircle className="text-green-500 text-7xl mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Application Received</h2>
              <p className="text-xl text-gray-600 mb-2">Thank you for registering, Dr. {formData.fullName.split(' ').pop()}.</p>
              <p className="text-gray-600 max-w-md mx-auto">
                 Please wait to be verified. Our admins are currently reviewing your application. You will receive an email at <strong>{formData.email}</strong> once approved.
              </p>
              <button onClick={() => window.location.href='/'} className="mt-8 text-[#000080] font-semibold hover:underline">Return to Home</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;