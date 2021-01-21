import React, { useState, useEffect } from 'react';
import Parse from './parse';

export function useAnnouncements(): any[] {
  const [announcements, setAnnouncements] = useState([]);

  const latestAnnouncementsRequest = () => {
    Parse.Cloud.run('latestAnnouncementsRequest').then(setAnnouncements);
  };

  const initHook = async () => {
    const announcementQ = new Parse.Query('Announcement');

    const announcementSub = await announcementQ.subscribe();

    announcementSub.on('open', latestAnnouncementsRequest);
    announcementSub.on('update', latestAnnouncementsRequest);
    announcementSub.on('create', latestAnnouncementsRequest);
  };

  useEffect(() => {
    initHook();
  }, []);

  return announcements;
}
