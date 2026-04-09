import React from "react";
import { Event } from "@shared/schema";
import { GraduationCap } from "lucide-react"; // Fallback logo

interface ReportProps {
  event: Event;
  type: "pre" | "post";
}

export const EventReportTemplate = React.forwardRef<HTMLDivElement, ReportProps>(({ event, type }, ref) => {
  // A4 aspect ratio at 96 DPI: 794x1123
  // We will force a fixed width and minimum height matching A4, and scale it later with html2canvas.
  
  const formatDateRange = (dateStr: Date, startTime: string, endTime: string) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const HeaderSJIT = () => (
    <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-red-500">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
         <GraduationCap className="text-blue-900 w-12 h-12" />
      </div>
      <div className="flex-1 text-center px-4">
        <p className="text-gray-600 italic font-serif text-sm">We Make You Shine</p>
        <h1 className="text-blue-900 font-bold text-2xl tracking-wide uppercase">St. JOSEPH'S INSTITUTE OF TECHNOLOGY</h1>
        <p className="text-green-600 font-bold text-sm">(An Autonomous Institution)</p>
        <p className="text-pink-600 font-bold text-lg">St. Joseph's Group of Institutions</p>
        <p className="text-black font-semibold text-xs mt-1">OMR, CHENNAI - 119</p>
      </div>
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-center">
         <span className="font-bold text-yellow-600 text-3xl">32</span>
         <span className="text-[10px] block leading-tight">Years of<br/>Excellence</span>
      </div>
    </div>
  );

  const HeaderSJCE = () => (
    <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-red-500">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
         <GraduationCap className="text-red-700 w-12 h-12" />
      </div>
      <div className="flex-1 text-center px-4">
        <p className="text-gray-600 italic font-serif text-sm">You Choose, We Do It</p>
        <h1 className="text-red-700 font-bold text-2xl tracking-wide uppercase">St. JOSEPH'S COLLEGE OF ENGINEERING</h1>
        <p className="text-green-600 font-bold text-sm">(An Autonomous Institution)</p>
        <p className="text-blue-900 font-bold text-lg">St. Joseph's Group of Institutions</p>
        <p className="text-black font-semibold text-xs mt-1">OMR, CHENNAI - 119</p>
      </div>
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-center">
         <span className="font-bold text-yellow-600 text-3xl">32</span>
      </div>
    </div>
  );

  const FooterBanner = () => (
    <div className="mt-auto pt-8">
      <div className="flex items-center justify-between bg-blue-900 text-white p-2 border-l-4 border-red-500">
        <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold">32</div>
            <div>
              <div className="font-bold text-lg uppercase tracking-wider leading-none">St. JOSEPH'S</div>
              <div className="text-[10px] uppercase">Group of Institutions</div>
              <div className="text-[10px]">OMR, CHENNAI - 119</div>
            </div>
        </div>
        <div className="text-right border-l-2 border-white pl-4">
           <div className="text-white italic font-serif">The Choice of</div>
           <div className="text-yellow-400 font-bold text-xl uppercase tracking-wider">Disciplined Toppers</div>
        </div>
      </div>
    </div>
  );

  const dateFormatted = formatDateRange(event.date, event.startTime, event.endTime);

  return (
    <div 
      ref={ref} 
      className="bg-white p-8 box-border flex flex-col justify-between overflow-hidden" 
      style={{ width: "794px", minHeight: "1123px", fontFamily: "'Times New Roman', Times, serif" }}
    >
      {type === "pre" ? (
        // ******************* PRE-EVENT TEMPLATE *******************
        <>
          <HeaderSJIT />
          <div className="flex flex-col items-center justify-start flex-1 text-center space-y-8 mt-12 px-8">
             <h2 className="text-red-500 font-bold text-2xl max-w-2xl leading-relaxed">
               Events scheduled for {dateFormatted}
             </h2>
             
             <h3 className="text-[#e250c2] font-bold text-3xl mt-6">{event.title}</h3>
             
             <div className="text-2xl font-bold flex gap-4 mt-6 items-center">
               <span className="text-[#7c306d]">Time : </span>
               <span className="text-[#3b7119]">{event.startTime} - {event.endTime}</span>
             </div>

             <div className="text-2xl font-bold flex gap-4 mt-4 items-center">
               <span className="text-[#139a9c]">Venue : </span>
               <span className="text-[#3b7119]">{event.venue}</span>
             </div>
             
             {event.preEventPosterPath && (
               <div className="mt-12 flex justify-center w-full">
                  <div className="border p-2 bg-gray-50 flex flex-col items-center">
                    <p className="text-sm text-gray-400 mb-2 italic">Event Poster Included</p>
                    <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-300">
                      [Poster Graphic]
                    </div>
                  </div>
               </div>
             )}
          </div>
          <FooterBanner />
        </>
      ) : (
        // ******************* POST-EVENT TEMPLATE *******************
        <>
          <HeaderSJCE />
          <div className="flex flex-col items-start justify-start flex-1 space-y-6 mt-8 px-8 text-lg font-bold">
             
             <div className="inline-block bg-yellow-300 text-red-600 px-2 py-1">
               Date: {dateFormatted}
             </div>

             <div className="text-[#2b4c7e] text-xl">
               Events: {event.title}
             </div>

             <div className="text-[#2b4c7e] text-xl">
               Venue: {event.venue}
             </div>
             
             <div className="text-[#2b4c7e] text-xl">
               No of Student Beneficiaries: {event.postEventStudentsBenefited || "N/A"}
             </div>

             {event.preEventAdditionalDetails && (
               <div className="text-red-600 text-xl font-bold flex gap-4">
                 <span>Vendor/Additional Details:</span>
                 <span className="text-[#2b4c7e] font-semibold">{event.preEventAdditionalDetails}</span>
               </div>
             )}

             {event.preEventGuestDetails && (
               <div className="mt-8 border-t pt-4 w-full">
                 <div className="inline-block bg-yellow-300 text-blue-800 underline px-2 py-1 mb-4 text-xl">
                   Guest Details:
                 </div>
                 <div className="text-[#2b4c7e] space-y-4 pl-4 text-xl font-semibold leading-relaxed whitespace-pre-wrap">
                   {event.preEventGuestDetails.split('\n').map((guest, idx) => (
                     <p key={idx}>{guest}</p>
                   ))}
                 </div>
               </div>
             )}
             
             {event.postEventDetails && (
               <div className="mt-8 border-t pt-4 w-full text-[#2b4c7e]">
                 <div className="inline-block bg-yellow-300 text-blue-800 underline px-2 py-1 mb-4 text-xl">
                   Event Summary:
                 </div>
                 <p className="text-lg font-normal whitespace-pre-wrap">{event.postEventDetails}</p>
               </div>
             )}
          </div>
          <FooterBanner />
        </>
      )}
    </div>
  );
});

EventReportTemplate.displayName = "EventReportTemplate";
