/*
 * Copyright 2022 Solid Aria Working Group.
 * MIT License
 *
 * Portions of this file are based on code from react-spectrum.
 * Copyright 2020 Adobe. All rights reserved.
 *
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { FocusWithinEvents } from "@solid-aria/types";
import { access, MaybeAccessor } from "@solid-primitives/utils";
import { Accessor, createMemo, createSignal } from "solid-js";

import { createSyntheticBlurEvent } from "./utils";

export interface CreateFocusWithinProps extends FocusWithinEvents {
  /**
   * Whether the focus within events should be disabled.
   */
  isDisabled?: MaybeAccessor<boolean | undefined>;
}

export type FocusWithinElementProps = Required<Pick<FocusWithinEvents, "onFocusIn" | "onFocusOut">>;

export interface FocusWithinResult {
  /**
   * Props to spread onto the target element.
   */
  focusWithinProps: Accessor<FocusWithinElementProps>;
}

/**
 * Handles focus events for the target and its descendants.
 */
export function createFocusWithin(props: CreateFocusWithinProps): FocusWithinResult {
  const [isFocusWithin, setIsFocusWithin] = createSignal(false);

  const onFocusOut: FocusWithinEvents["onFocusOut"] = event => {
    if (access(props.isDisabled)) {
      return;
    }

    const currentTarget = event.currentTarget as Element | null;
    const relatedTarget = event.relatedTarget as Element | null;

    // We don't want to trigger onFocusOut and then immediately onFocusIn again
    // when moving focus inside the element. Only trigger if the currentTarget doesn't
    // include the relatedTarget (where focus is moving).
    if (isFocusWithin() && !currentTarget?.contains(relatedTarget)) {
      setIsFocusWithin(false);
      props.onFocusOut?.(event);
      props.onFocusWithinChange?.(false);
    }
  };

  const onSyntheticFocus = createSyntheticBlurEvent(onFocusOut);

  const onFocusIn: FocusWithinEvents["onFocusIn"] = event => {
    if (access(props.isDisabled)) {
      return;
    }

    if (!isFocusWithin()) {
      props.onFocusIn?.(event);
      props.onFocusWithinChange?.(true);
      setIsFocusWithin(true);
      onSyntheticFocus(event);
    }
  };

  const focusWithinProps: Accessor<FocusWithinElementProps> = createMemo(() => ({
    onFocusIn,
    onFocusOut
  }));

  return { focusWithinProps };
}
