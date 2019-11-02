import React from "react";
import { observer } from "mobx-react-lite";

type Props = {};

export const VariablesTable: React.FC<Props> = observer(() => {
  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Valor</th>
          <th>Unidad</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>A</td>
          <td>12</td>
          <td>km</td>
        </tr>
      </tbody>
    </table>
  );
});
