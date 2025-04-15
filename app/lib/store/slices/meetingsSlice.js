import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  instantMeeting: {
    link: '',
    time: '',
  },
  scheduledMeeting: {
    link: '',
    time: '',
  },
  error: '',
  isCreatingInstantMeeting: false,
  isCreatingScheduledMeeting: false,
};

const meetingsSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {
    setInstantMeeting: (state, action) => {
      state.instantMeeting = action.payload;
    },
    setScheduledMeeting: (state, action) => {
      state.scheduledMeeting = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setCreatingInstantMeeting: (state, action) => {
      state.isCreatingInstantMeeting = action.payload;
    },
    setCreatingScheduledMeeting: (state, action) => {
      state.isCreatingScheduledMeeting = action.payload;
    },
    clearMeetings: (state) => {
      state.instantMeeting = { link: '', time: '' };
      state.scheduledMeeting = { link: '', time: '' };
      state.error = '';
    },
  },
});

export const {
  setInstantMeeting,
  setScheduledMeeting,
  setError,
  setCreatingInstantMeeting,
  setCreatingScheduledMeeting,
  clearMeetings,
} = meetingsSlice.actions;

export default meetingsSlice.reducer; 