import { PasswordField } from '@/common/components/inputs/PasswordField';
import { SelectField } from '@/common/components/inputs/SelectField';
import * as form from '@/styles/global/Form.css';
import { PPPOE_SERVICE_OPTIONS } from '@/constants/pppoe/PppoeAccounts.constants';
import type { PppoeAccountForm } from '@/hooks/pppoe/usePppoeAccountForm';

/** What the router stores on the secret itself: name, password, service. */
export function PppoeSecretFields({ vm }: { vm: PppoeAccountForm }) {
  return (
    <>
      <div>
        <label htmlFor="pppoe-name" className={form.label}>
          Name
        </label>
        <input
          id="pppoe-name"
          type="text"
          required
          autoFocus={!vm.isEdit}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={vm.name}
          onChange={(e) => vm.setName(e.target.value)}
          placeholder="e.g. 201-ROOM"
          className={form.field}
        />
        <p className={form.hint}>
          The PPPoE username the CPE dials with. Case-sensitive, and stored
          exactly as the router spells it.
        </p>
      </div>

      <PasswordField
        id="pppoe-password"
        label="Password"
        value={vm.password}
        onChange={vm.setPassword}
      />

      <SelectField
        id="pppoe-service"
        label="Service"
        value={vm.service}
        options={PPPOE_SERVICE_OPTIONS}
        onChange={vm.setService}
      />
    </>
  );
}
