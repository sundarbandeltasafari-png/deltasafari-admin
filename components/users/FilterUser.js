"use client"
import React from 'react'

function FilterUser() {
  return (
    <>
      <h5 className="card-title mb-0">Filters</h5>
      <div className="d-flex justify-content-between align-items-center row gx-5 pt-4 gap-5 gap-md-0">
        <div className="col-md-4 user_role">
          <select id="UserRole" className="form-select text-capitalize">
            <option value="">Select Role</option>
            <option value="Admin">Admin</option>
            <option value="Author">Author</option>
            <option value="Editor">Editor</option>
            <option value="Maintainer">Maintainer</option>
            <option value="Subscriber">Subscriber</option>
          </select>
        </div>
        <div className="col-md-4 user_plan">
          <select id="UserPlan" className="form-select text-capitalize">
            <option value="">Select Plan</option>
            <option value="Basic">Basic</option>
            <option value="Company">Company</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Team">Team</option>
          </select>
        </div>
        <div className="col-md-4 user_status">
          <select id="FilterTransaction" className="form-select text-capitalize">
            <option value="">Select Status</option>
            <option value="Pending" className="text-capitalize">Pending</option>
            <option value="Active" className="text-capitalize">Active</option>
            <option value="Inactive" className="text-capitalize">Inactive</option>
          </select>
        </div>
      </div>
    </>
  )
}

export default FilterUser