"use client"
import React from 'react'

function FilterUser({ type, allPermisions, setUserStatus, setRoleChange }) {
  return (
    <>
      <h5 className="card-title mb-0">Filters</h5>
      <div className="d-flex justify-content-start align-items-center row gx-5 pt-4 gap-5 gap-md-0">
        {type == 'adminuser' && <div className="col-md-4 user_role">
          <select id="UserRole" onChange={(e)=> { setRoleChange(e.target.value) }} className="form-select text-capitalize">
            <option value="">All Roles</option>
            {
              allPermisions && allPermisions.map((per, index) => {
                return <option key={index} value={per?.id}>{per?.name}</option>
              })
            }
          </select>
        </div>}

        <div className="col-md-4 user_status">
          <select id="FilterTransaction" onChange={(e)=> { setUserStatus(e.target.value) }} className="form-select text-capitalize">
            <option value="">All Users</option>
            <option value="1" className="text-capitalize">Active</option>
            <option value="0" className="text-capitalize">Inactive</option>
            <option value="3" className="text-capitalize">Deleted</option>
          </select>
        </div>
      </div>
    </>
  )
}

export default FilterUser