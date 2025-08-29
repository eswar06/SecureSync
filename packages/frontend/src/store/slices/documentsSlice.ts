import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Document } from '@securesync/shared';

interface DocumentsState {
  documents: Document[];
  selectedDocument: Document | null;
  loading: boolean;
  error: string | null;
}

const initialState: DocumentsState = {
  documents: [],
  selectedDocument: null,
  loading: false,
  error: null,
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload;
    },
    setSelectedDocument: (state, action: PayloadAction<Document | null>) => {
      state.selectedDocument = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setDocuments, setSelectedDocument, setLoading, setError } = documentsSlice.actions;
export default documentsSlice.reducer;
