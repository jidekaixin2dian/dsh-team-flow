import type { Context } from '@deepseek-ai/cordis'
import { validateJsonSchemaValue, type ToolDefinition } from '@deepseek-ai/dsh-tools'

// Detection binds to the serialized wake value, not to the visible text, so
// presentation copy can change locale without breaking presentResult routing.
const WAKE_VALUE = { timedOut: false, reason: 'user-steer' } as const
const WAKE_VALUE_JSON = JSON.stringify(WAKE_VALUE)
const WAKE_TEXT = '用户插话结束本次等待（User Steer）；队友继续运行。\n'

/** Transform before registration; never mutate a registered readonly definition. */
export function decorateRegistrations(ctx: Context): () => void {
  const tools = ctx.tools
  if (typeof tools.register !== 'function' || typeof validateJsonSchemaValue !== 'function') throw new Error('Unsupported Tool Runtime registration contract')
  const original = tools.register
  const descriptor = Object.getOwnPropertyDescriptor(tools, 'register')
  let active = true
  const wrapper: typeof tools.register = function (this: typeof tools, definition: ToolDefinition) {
    if (!active || definition.name !== 'wait_agent' || !definition.output || typeof definition.output.render !== 'function') return original.call(this, definition)
    const probe = WAKE_VALUE
    if (!validateJsonSchemaValue(definition.output.schema, probe, 'value').length) return original.call(this, definition)
    if (validateJsonSchemaValue(definition.output.schema, { timedOut: false }, 'value').length) return original.call(this, definition)
    const output = definition.output
    const adapted: ToolDefinition = {
      ...definition,
      output: {
        ...output,
        schema: { oneOf: [output.schema, { type: 'object', additionalProperties: false,
          required: ['timedOut', 'reason'], properties: { timedOut: { type: 'boolean', const: false }, reason: { type: 'string', const: 'user-steer' } } }] },
        render(args, value) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value) && value.reason === 'user-steer') return [{ type: 'text', text: WAKE_TEXT + WAKE_VALUE_JSON }]
          return output.render(args, value)
        },
        // Preserve normal presentation; a new branch must not run a legacy projector.
        ...(output.presentationMeta ? { presentationMeta(args, value) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value) && value.reason === 'user-steer') return { reason: 'user-steer' }
          return output.presentationMeta!(args, value)
        } } : {}),
      },
      ...(definition.presentResult ? { presentResult(args, result) {
        if (!result.isError && result.content.some(block => block.type === 'text' && block.text.endsWith(WAKE_VALUE_JSON))) return { card: 'generic', title: '用户插话结束等待', content: result.content }
        return definition.presentResult!(args, result)
      } } : {}),
    }
    return original.call(this, adapted)
  }
  Object.defineProperty(tools, 'register', { value: wrapper, configurable: true, writable: true })
  return () => {
    if (!active) return
    active = false
    if (Object.getOwnPropertyDescriptor(tools, 'register')?.value === wrapper) {
      if (descriptor) Object.defineProperty(tools, 'register', descriptor)
      else Reflect.deleteProperty(tools, 'register')
    }
  }
}
