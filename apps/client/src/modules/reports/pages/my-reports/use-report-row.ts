import { useCallback, useMemo, useState } from 'react';
import { actionsFor } from './report-row.utils.js';
import { rowErrorMessage } from './report-row-error.utils.js';
import type {
  ChangeStatusFn,
  MyReport,
  ReportRowValue,
  StatusTarget,
} from '../../reports.types.js';

export function useReportRow(
  entry: MyReport,
  onChangeStatus: ChangeStatusFn,
): ReportRowValue {
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const actions = useMemo(
    () => actionsFor(entry.report),
    [entry.report],
  );

  const run = useCallback(
    (target: StatusTarget) => {
      setPending(true);
      setErrorMessage(null);
      void onChangeStatus(entry.report.id, target).match(
        () => {
          setPending(false);
        },
        (error) => {
          setPending(false);
          setErrorMessage(rowErrorMessage(error));
        },
      );
    },
    [entry.report.id, onChangeStatus],
  );

  return { actions, pending, errorMessage, run };
}
