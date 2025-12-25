package com.aishu.wf.core.engine.identity.util;

public class IdentityException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	public IdentityException(String message, Throwable cause) {
		super(message, cause);
	}

	public IdentityException(String message) {
		super(message);
	}

	public IdentityException( Throwable cause) {
		super("",cause);
	}

	@Override
	public Throwable fillInStackTrace() {
		return this;
	}
}