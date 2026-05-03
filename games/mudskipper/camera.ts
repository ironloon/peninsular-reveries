export async function requestCamera(videoEl: HTMLVideoElement): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: 'user' },
    })
    videoEl.srcObject = stream
    return true
  } catch {
    return false
  }
}

export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop())
}
