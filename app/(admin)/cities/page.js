"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { getAllCityUrl, deleteCityUrl, updateCityUrl } from '@/app/routes/serviceRoutes';
import DeleteModal from '@/components/admin/common/DeleteModal';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';
import SearchList from '@/components/common/SearchList';
import { showMessage } from '@/libs/commonHelper';
import { urlEncode } from '@/libs/urlHelper';
import Link from 'next/link';

// Seed data with switch flags
const defaultCities = [
  {
    id: "1",
    name: "Kolkata",
    state: "West Bengal",
    country: "India",
    image: "/images/kolkata.jpg",
    show_in_package: true,
    show_in_corporate: true,
    show_in_hotel: true,
    show_in_cab: true
  },
  {
    id: "2",
    name: "Mumbai",
    state: "Maharashtra",
    country: "India",
    image: "/images/mumbai.jpg",
    show_in_package: true,
    show_in_corporate: false,
    show_in_hotel: true,
    show_in_cab: false
  },
  {
    id: "3",
    name: "Los Angeles",
    state: "California",
    country: "United States",
    image: "/images/los_angeles.jpg",
    show_in_package: false,
    show_in_corporate: true,
    show_in_hotel: false,
    show_in_cab: true
  },
  {
    id: "4",
    name: "Dhaka",
    state: "Dhaka",
    country: "Bangladesh",
    image: "/images/dhaka.jpg",
    show_in_package: true,
    show_in_corporate: true,
    show_in_hotel: false,
    show_in_cab: false
  }
];

export default function CitiesPage() {
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [searchData, setSearchData] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [deleteStatus, setDeleteStatus] = useState(false);
  const [deleteCityItem, setDeleteCityItem] = useState(null);
  
  const route = useRouter();
  const token = useSelector((state) => state.adminAuth?.token);

  // Fetch cities
  async function loadCities() {
    try {
      setLoading(true);
      // Attempt API call
      const response = await axios.get(getAllCityUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000
      });

      if (response.data && response.data.status && response.data.cities) {
        setCities(response.data.cities);
      } else {
        // Fallback to local storage if API call succeeded but did not return active cities
        loadFromLocalStorage();
      }
    } catch (error) {
      console.log('Backend API failed, loading cities from LocalStorage:', error.message);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }

  function loadFromLocalStorage() {
    let localData = localStorage.getItem('cities');
    if (!localData) {
      localStorage.setItem('cities', JSON.stringify(defaultCities));
      localData = JSON.stringify(defaultCities);
    }
    setCities(JSON.parse(localData));
  }

  useEffect(() => {
    loadCities();
  }, []);

  // Filter logic
  const countries = ['All', ...new Set(cities.map(c => c.country))];
  
  const filteredCities = cities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchData.toLowerCase()) ||
      city.state.toLowerCase().includes(searchData.toLowerCase()) ||
      city.country.toLowerCase().includes(searchData.toLowerCase());
      
    const matchesCountry = selectedCountry === 'All' || city.country === selectedCountry;
    
    return matchesSearch && matchesCountry;
  });


  // Handle Delete Confirmation
  function handleDeleteDetect(city) {
    setDeleteCityItem(city);
    setDeleteStatus(true);
  }

  // Perform Deletion
  async function handleDelete(cityId) {
    setLoading(true);
    try {
      // Attempt API Delete
      const response = await axios.delete(`${deleteCityUrl}?id=${urlEncode(cityId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 3000
      });

      if (response.data && response.data.status) {
        showMessage(response.data.msg || 'City deleted successfully', 'success');
        setCities(prev => prev.filter(c => c.id !== cityId));
      } else {
        // Fallback to LocalStorage delete
        deleteFromLocalStorage(cityId);
      }
    } catch (error) {
      console.log('Backend API delete failed, deleting from LocalStorage:', error.message);
      deleteFromLocalStorage(cityId);
    } finally {
      setDeleteStatus(false);
      setLoading(false);
    }
  }

  function deleteFromLocalStorage(cityId) {
    let localData = localStorage.getItem('cities');
    if (localData) {
      const parsed = JSON.parse(localData);
      const filtered = parsed.filter(c => c.id !== cityId);
      localStorage.setItem('cities', JSON.stringify(filtered));
      setCities(filtered);
      showMessage('City deleted successfully (LocalStorage)', 'success');
    }
  }

  // Calculate statistics
  const totalCities = cities.length;
  const totalCountries = new Set(cities.map(c => c.country)).size;
  const totalStates = new Set(cities.map(c => c.state)).size;

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
        
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-6">
        <div>
          <h4 className="fw-semibold mb-0">City Master</h4>
          <p className="text-muted small mb-0">Manage global cities, country relations, and show locations</p>
        </div>
      </div>
      {/* Main Listing Table Card */}
      <div className="card">
        
        {/* Table Filters */}
        <div className="card-header border-bottom">
          <h5 className="card-title mb-0 fw-semibold">Search & Filters</h5>
          <div className="row g-4 mt-2">
            <div className="col-md-4 col-sm-12">
              <label className="form-label text-muted small fw-medium">Filter by Country</label>
              <select 
                className="form-select form-select-sm" 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {countries.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="card-body py-4 border-bottom bg-light bg-opacity-10">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-4">
            <div className="flex-grow-1 max-w-400">
              <SearchList handleSearch={setSearchData} placeholder="Search by name, state or country..." />
            </div>
            
            <div className="dt-buttons btn-group flex-wrap">
              <Link href="/cities/add" className="btn btn-primary d-flex align-items-center rounded-pill px-4 py-2 fw-semibold shadow-sm transition-all">
                <i className="ri-add-line me-2 fs-5"></i>
                <span>Add City</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          {loading ? (
            <div className="py-5">
              <LoadingComponent />
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="py-5">
              <NotFound />
            </div>
          ) : (
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '1000px' }}>
              <thead className="table-light text-uppercase">
                <tr>
                  <th className="py-3 ps-4" style={{ width: '80px' }}>Preview</th>
                  <th className="py-3">City Name</th>
                  <th className="py-3">State / Province</th>
                  <th className="py-3">Country</th>
                  <th className="py-3 pe-4 text-end" style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((city, idx) => (
                  <tr key={city.id || idx}>
                    <td className="ps-4">
                      <div 
                        className="rounded-3 overflow-hidden border bg-light d-flex align-items-center justify-content-center"
                        style={{ width: '60px', height: '40px' }}
                      >
                        <img 
                          src={city.city_image ? (city.city_image.startsWith('data:') || city.city_image.startsWith('/') ? city.city_image : process.env.NEXT_PUBLIC_SERVER_URL + city.city_image) : "/images/noimage.jpg"} 
                          alt={city.name} 
                          className="w-100 h-100 object-fit-cover"
                          onError={(e) => { e.target.src = "/images/noimage.jpg"; }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className="fw-semibold text-heading">{city.name}</span>
                    </td>
                    <td>
                      <span className="text-body">{city.state}</span>
                    </td>
                    <td>
                      <span className="badge bg-label-info text-capitalize">{city.country}</span>
                    </td>
                    <td className="pe-4 text-end">
                      <button 
                        onClick={() => route.push('/cities/edit/' + urlEncode(city.id))}
                        className="btn btn-icon btn-text-secondary rounded-pill me-1"
                        title="Edit City"
                      >
                        <i className="bi bi-pencil-square fs-5"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteDetect(city)} 
                        className="btn btn-icon btn-text-danger rounded-pill"
                        title="Delete City"
                      >
                        <i className="bi bi-trash fs-5"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Deletion Modal */}
      {deleteStatus && (
        <DeleteModal 
          status={deleteStatus} 
          onChangeStatus={setDeleteStatus} 
          handleChange={handleDelete} 
          post={deleteCityItem} 
        />
      )}
    </div>
  );
}