import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import MuiLink from '@mui/material/Link';
import { styled } from '@mui/material/styles';

// Add support for the sx prop for consistency with the other branches.
const Anchor = styled('a')({
  color: 'inherit',
  textDecoration: 'none',
});

export const NextLinkComposed = React.forwardRef(function NextLinkComposed(props, ref) {
  const { to, linkAs, href, replace, scroll, shallow, prefetch, locale, noLinkStyle, ...other } = props;

  return (
    <NextLink
      ref={ref}
      href={to}
      prefetch={prefetch}
      as={linkAs}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      passHref
      locale={locale}
      style={noLinkStyle ? { textDecoration: 'none', color: 'inherit' } : {}}
      {...other}
    />
  );
});

NextLinkComposed.propTypes = {
  href: PropTypes.any,
  linkAs: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  locale: PropTypes.string,
  passHref: PropTypes.bool,
  prefetch: PropTypes.bool,
  replace: PropTypes.bool,
  scroll: PropTypes.bool,
  shallow: PropTypes.bool,
  to: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
};

// A styled version of the Next.js Link component:
// https://nextjs.org/docs/api-reference/next/link
const Link = React.forwardRef(function Link(props, ref) {
  const {
    sx,
    activeClassName = 'active',
    as: linkAs,
    className: classNameProps,
    href,
    noLinkStyle,
    role, // Link don't have roles.
    ...other
  } = props;

  const router = useRouter();
  const pathname = typeof href === 'string' ? href : href.pathname;
  const className = clsx(classNameProps, {
    [activeClassName]: router.pathname === pathname && activeClassName,
  });

  const isExternal =
    typeof href === 'string' && (href.indexOf('http') === 0 || href.indexOf('mailto:') === 0);

  if (isExternal) {
    if (noLinkStyle) {
      return <Anchor sx={sx} className={className} href={href} ref={ref} {...other} />;
    }

    return <MuiLink sx={sx} className={className} href={href} ref={ref} {...other} />;
  }

  if (noLinkStyle) {
    return <NextLinkComposed noLinkStyle={noLinkStyle} sx={sx} className={className} ref={ref} to={href} {...other} />;
  }

  return (
    <MuiLink
      sx={sx}
      component={NextLinkComposed}
      linkAs={linkAs}
      className={className}
      ref={ref}
      to={href}
      {...other}
    />
  );
});

Link.propTypes = {
  sx: PropTypes.object,
  activeClassName: PropTypes.string,
  as: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  className: PropTypes.string,
  href: PropTypes.any,
  linkAs: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  noLinkStyle: PropTypes.bool,
  role: PropTypes.string,
};

export default Link;
