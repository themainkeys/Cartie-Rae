const fs = require('fs');

const path = 'src/views/AdminPortal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Left Panel: TikTok / Reels Creator to end of grid
const startMarker = '{/* Left Panel: TikTok / Reels Creator */}';
const endMarker = '          {/* STORE EDITOR COMPONENT: PORTAL SETTINGS             */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  // We want to replace from `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">` which is just before startMarker.
  const gridStart = content.lastIndexOf('<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">', startIndex);
  if (gridStart !== -1) {
    // We want to replace up to the `</div>\n          )}` before endMarker.
    const endStr = `            </div>\n          )}\n\n          {/* ==================================================== */}\n          {/* STORE EDITOR COMPONENT: PORTAL SETTINGS             */}`;
    const actualEndIndex = content.indexOf(endStr, startIndex);
    
    if (actualEndIndex !== -1) {
      const replacement = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <VideoManager requirePermission={requirePermission} />
              <GalleryManager requirePermission={requirePermission} />
            </div>
          )}

          {/* ==================================================== */}
          {/* STORE EDITOR COMPONENT: PORTAL SETTINGS             */}`;
      
      content = content.slice(0, gridStart) + replacement + content.slice(actualEndIndex + endStr.length);
      console.log('Successfully replaced JSX block.');
    } else {
      console.log('actualEndIndex not found', content.slice(endIndex-200, endIndex));
    }
  } else {
    console.log('gridStart not found');
  }
} else {
  console.log('Markers not found', startIndex, endIndex);
}

// 2. Remove Analytics Modal
const modalStart = '{/* Analytics Modal */}';
const modalEndIndex = content.lastIndexOf('</div>'); // The end of the component
const modalStartIndex = content.indexOf(modalStart);

if (modalStartIndex !== -1) {
  // We want to remove from modalStart up to just before the last </div>
  const lastReturnDiv = content.lastIndexOf('</div>\n  );\n};');
  if (lastReturnDiv !== -1 && modalStartIndex < lastReturnDiv) {
    content = content.slice(0, modalStartIndex) + content.slice(lastReturnDiv);
    console.log('Successfully removed Analytics Modal.');
  } else {
    console.log('Last return div not found properly');
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done.');
