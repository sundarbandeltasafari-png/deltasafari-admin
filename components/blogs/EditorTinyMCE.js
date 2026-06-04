import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function EditorTinyMCE({ handleEditorChange, value }) {
  return (
    <Editor
      apiKey={'c5nqkc7jadyaytjmb828w1snv8btq5hu8y7t94hrzz4eleye'}
      onEditorChange={handleEditorChange}
      value={value}
      init={{
        height: 500,
        menubar: false,
        // 2. Look closely at this array and remove 'checklist'
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        // 3. Remove 'checklist' from the toolbar string as well
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        tinymceai_token_provider: async () => {
          await fetch(`https://demo.api.tiny.cloud/1/c5nqkc7jadyaytjmb828w1snv8btq5hu8y7t94hrzz4eleye/auth/random`, { method: "POST", credentials: "include" });
          return { token: await fetch(`https://demo.api.tiny.cloud/1/c5nqkc7jadyaytjmb828w1snv8btq5hu8y7t94hrzz4eleye/jwt/tinymceai`, { credentials: "include" }).then(r => r.text()) };
        },
        uploadcare_public_key: 'd3b20d32fc6a2a57f19e',
      }}
    />
  );
}



//  <Editor
//       apiKey='67ps2qhpl78wzz80un5144gpfa5wiihf4z4tiscoxso5i9xg'
//       onEditorChange={handleEditorChange}
//       init={{
//         plugins: [
//           // Core editing features
//           'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
//           // Your account includes a free trial of TinyMCE premium features
//           // Try the most popular premium features until May 11, 2026:
//           'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'tinymceai', 'uploadcare', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
//         ],
//         toolbar: 'undo redo | tinymceai-chat tinymceai-quickactions tinymceai-review | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
//         tinycomments_mode: 'embedded',
//         tinycomments_author: 'Author name',
//         mergetags_list: [
//           { value: 'First.Name', title: 'First Name' },
//           { value: 'Email', title: 'Email' },
//         ],
//         tinymceai_token_provider: async () => {
//           await fetch(`https://demo.api.tiny.cloud/1/67ps2qhpl78wzz80un5144gpfa5wiihf4z4tiscoxso5i9xg/auth/random`, { method: "POST", credentials: "include" });
//           return { token: await fetch(`https://demo.api.tiny.cloud/1/67ps2qhpl78wzz80un5144gpfa5wiihf4z4tiscoxso5i9xg/jwt/tinymceai`, { credentials: "include" }).then(r => r.text()) };
//         },
//         uploadcare_public_key: '2fc7fb94fe5de67bb5fa',
//         toolbar_mode: "wrap",
//         // Removes the "File", "Edit", "View", etc. menu bar
//         menubar: false,
//       }}
//       initialValue=""
//     />