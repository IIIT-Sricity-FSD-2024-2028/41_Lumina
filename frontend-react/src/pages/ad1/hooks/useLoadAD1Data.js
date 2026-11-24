import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadAD1Planning } from '../../../store/ad1/ad1-actions';
import { selectAD1Error, selectAD1Loading } from '../../../store/ad1/ad1-slice';

export default function useLoadAD1Data() {
  const dispatch = useDispatch();
  const loading = useSelector(selectAD1Loading);
  const error = useSelector(selectAD1Error);

  useEffect(() => {
    dispatch(loadAD1Planning());
  }, [dispatch]);

  return { loading, error };
}
