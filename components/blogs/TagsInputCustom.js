"use client"; // Required for Next.js App Router

import React, { useState } from "react";
import { TagsInput } from "react-tag-input-component";

export default function TagsInputCustom({tags, setTags, name="Blog"}) {
  return (
    <div className={"max-w-md p-4 " + (name != 'Blog' && "mt-0")}>
      <label className="form-label fw-semibold">
        {name} Tags <span className='text-danger'>*</span>
      </label>
      
      <TagsInput
        value={tags}
        onChange={setTags}
        name="tags"
        placeHolder={`Enter your ${name} tags...`}
      />
      
    </div>
  );
}
