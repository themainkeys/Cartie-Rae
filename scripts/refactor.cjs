const fs = require('fs');

const path = 'src/views/AdminPortal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Left Panel: TikTok / Reels Creator to end of grid
const startMarker = '{/* Left Panel: TikTok / Reels Creator */}';
const endMarker = '{/* STORE EDITOR COMPONENT: PORTAL SETTINGS             */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const gridStart = content.lastIndexOf('<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">', startIndex);
  if (gridStart !== -1) {
    const replacement = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <VideoManager requirePermission={requirePermission} />
              <GalleryManager requirePermission={requirePermission} />
            </div>
          )}

          {/* ==================================================== */}
          {/* STORE EDITOR COMPONENT: PORTAL SETTINGS             */}`;
    
    // Find the comment line before endMarker
    const commentBeforeEndMarker = '{/* ==================================================== */}';
    const commentBeforeEndIndex = content.lastIndexOf(commentBeforeEndMarker, endIndex);
    if (commentBeforeEndIndex !== -1) {
       content = content.slice(0, gridStart) + replacement + content.slice(endIndex + endMarker.length);
       console.log('Successfully replaced JSX block.');
    }
  }
}

// 2. Remove Analytics Modal
const modalStart = '{/* Analytics Modal */}';
const modalStartIndex = content.indexOf(modalStart);

if (modalStartIndex !== -1) {
  const endReturn = '    </div>\\n  );\\n};';
  
  // Find the last </div> before the end of the file
  const lastDivIndex = content.lastIndexOf('</div>');
  if (lastDivIndex !== -1 && modalStartIndex < lastDivIndex) {
    content = content.slice(0, modalStartIndex) + content.slice(lastDivIndex);
    console.log('Successfully removed Analytics Modal.');
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done.');
